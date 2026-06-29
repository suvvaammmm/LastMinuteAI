import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import styles from "./Dashboard.module.css";

// ── Primitives ────────────────────────────────────────────────────────────────

function Spinner() {
  return <span className={styles.spinner} />;
}

function Badge({ level }) {
  const map = {
    HIGH:     styles.badgeHigh,
    MEDIUM:   styles.badgeMedium,
    LOW:      styles.badgeLow,
    CRITICAL: styles.badgeCritical,
  };
  const labels = { HIGH: "High", MEDIUM: "Medium", LOW: "Low", CRITICAL: "Critical" };
  return (
    <span className={`${styles.badge} ${map[level] || styles.badgeMedium}`}>
      {labels[level] || level}
    </span>
  );
}

function Card({ children, className = "" }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
    </div>
  );
}

function Btn({ onClick, loading, children, variant = "primary", style }) {
  const cls = variant === "danger" ? styles.btnDanger
            : variant === "ghost"  ? styles.btnGhost
            : styles.btnPrimary;
  return (
    <button className={`${styles.btn} ${cls}`} onClick={onClick} disabled={loading} style={style}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Err({ msg }) {
  if (!msg) return null;
  return <div className={styles.error}>⚠ {msg}</div>;
}

// ── Nav config ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "tasks",    label: "Task Board",    icon: "▦",  sub: "Manage deadlines" },
  { id: "planner",  label: "AI Planner",    icon: "⬡",  sub: "Break down tasks" },
  { id: "priority", label: "Prioritize",    icon: "↑↑", sub: "Rank by urgency"  },
  { id: "rescue",   label: "Rescue Mode",   icon: "⚡",  sub: "Beat the clock"   },
  { id: "coach",    label: "Daily Coach",   icon: "◎",  sub: "Plan your day"    },
];

const TAB_META = {
  tasks:    { title: "Task Board",    sub: "Track your deadlines and commitments in one place." },
  planner:  { title: "AI Planner",   sub: "Describe any task and get a step-by-step action plan." },
  priority: { title: "Prioritize",   sub: "AI ranks your tasks by urgency and impact." },
  rescue:   { title: "Rescue Mode",  sub: "Running out of time? Get an emergency action plan." },
  coach:    { title: "Daily Coach",  sub: "Personalized daily schedule and motivation." },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab]     = useState("tasks");
  const [time, setTime]               = useState(new Date());

  // Tasks
  const [taskName, setTaskName]       = useState("");
  const [deadline, setDeadline]       = useState("");
  const [estHours, setEstHours]       = useState("");
  const [taskList, setTaskList]       = useState([]);
  const [taskError, setTaskError]     = useState("");

  // Planner
  const [planTask, setPlanTask]       = useState("");
  const [plan, setPlan]               = useState("");
  const [planLoad, setPlanLoad]       = useState(false);
  const [planErr, setPlanErr]         = useState("");

  // Priority
  const [priInput, setPriInput]       = useState("");
  const [priorities, setPriorities]   = useState([]);
  const [priLoad, setPriLoad]         = useState(false);
  const [priErr, setPriErr]           = useState("");

  // Rescue
  const [resTask, setResTask]         = useState("");
  const [resNeed, setResNeed]         = useState("");
  const [resLeft, setResLeft]         = useState("");
  const [resResult, setResResult]     = useState(null);
  const [resLoad, setResLoad]         = useState(false);
  const [resErr, setResErr]           = useState("");

  // Coach
  const [coachInput, setCoachInput]   = useState("");
  const [coach, setCoach]             = useState(null);
  const [coachLoad, setCoachLoad]     = useState(false);
  const [coachErr, setCoachErr]       = useState("");

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now       = new Date();
  const pending   = taskList.filter(t => !t.completed).length;
  const totalH    = taskList.reduce((s, t) => s + Number(t.hours), 0);
  const highRisk  = taskList.filter(t => {
    const diff = (new Date(t.deadline) - now) / 86400000;
    return diff <= 1 && !t.completed;
  }).length;
  const score     = Math.max(0, 100 - highRisk * 15);

  const urgentCount = taskList.filter(t => {
    const diff = (new Date(t.deadline) - now) / 86400000;
    return diff <= 1 && !t.completed;
  }).length;

  // ── Task handlers ──────────────────────────────────────────────────────────
  const addTask = () => {
    setTaskError("");
    if (!taskName.trim() || !deadline || !estHours) {
      setTaskError("Please fill in all three fields."); return;
    }
    if (Number(estHours) <= 0) {
      setTaskError("Hours must be a positive number."); return;
    }
    setTaskList(p => [...p, {
      id: Date.now(), name: taskName.trim(), deadline,
      hours: Number(estHours), completed: false,
    }]);
    setTaskName(""); setDeadline(""); setEstHours("");
  };

  const toggleTask = id => setTaskList(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = id => setTaskList(p => p.filter(t => t.id !== id));

  const daysUntil = d => {
    const diff = new Date(d) - new Date();
    return Math.ceil(diff / 86400000);
  };

  // ── AI handlers ────────────────────────────────────────────────────────────
  const generatePlan = async () => {
    if (!planTask.trim()) { setPlanErr("Enter a task first."); return; }
    setPlanErr(""); setPlanLoad(true); setPlan("");
    try {
      const r = await API.post("/plan", { task: planTask });
      setPlan(r.data.plan);
    } catch (e) { setPlanErr(e.message); }
    finally { setPlanLoad(false); }
  };

  const generatePriority = async () => {
    const arr = priInput.split("\n").map(t => t.trim()).filter(Boolean);
    if (arr.length < 2) { setPriErr("Enter at least 2 tasks."); return; }
    setPriErr(""); setPriLoad(true); setPriorities([]);
    try {
      const r = await API.post("/priority", { tasks: arr });
      setPriorities(r.data.priorities || []);
    } catch (e) { setPriErr(e.message); }
    finally { setPriLoad(false); }
  };

  const generateRescue = async () => {
    if (!resTask.trim() || !resNeed || !resLeft) { setResErr("Fill in all fields."); return; }
    setResErr(""); setResLoad(true); setResResult(null);
    try {
      const r = await API.post("/rescue", {
        task: resTask, hours_needed: parseInt(resNeed), hours_left: parseInt(resLeft),
      });
      setResResult(r.data);
    } catch (e) { setResErr(e.message); }
    finally { setResLoad(false); }
  };

  const generateCoach = async () => {
    const arr = coachInput.split("\n").map(t => t.trim()).filter(Boolean);
    if (arr.length === 0) { setCoachErr("Enter at least one task."); return; }
    setCoachErr(""); setCoachLoad(true); setCoach(null);
    try {
      const r = await API.post("/daily-coach", { tasks: arr });
      setCoach(r.data);
    } catch (e) { setCoachErr(e.message); }
    finally { setCoachLoad(false); }
  };

  const meta = TAB_META[activeTab];
  const clockStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr  = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className={styles.shell}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>⚡</div>
          <div className={styles.brandText}>
            <div className={styles.brandName}>Last<em>Minute</em>AI</div>
            <div className={styles.brandSub}>Deadline Companion</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>Workspace</div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navItemText}>{tab.label}</span>
              {tab.id === "tasks" && urgentCount > 0 && (
                <span className={styles.navBadge}>{urgentCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.statusDot} />
          <span>AI online</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>

        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.pageTitle}>{meta.title}</div>
            <div className={styles.pageSubtitle}>{meta.sub}</div>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.clock}>{dateStr} · {clockStr}</div>
          </div>
        </div>

        <div className={styles.content}>

          {/* ══ TASK BOARD ══════════════════════════════════════════════════ */}
          {activeTab === "tasks" && (<>
            <div className={styles.statsStrip}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "rgba(124,110,245,0.12)" }}>📋</div>
                <div className={styles.statVal} style={{ color: "var(--accent2)" }}>{pending}</div>
                <div className={styles.statLabel}>Pending tasks</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "rgba(248,113,113,0.1)" }}>🔥</div>
                <div className={styles.statVal} style={{ color: "var(--red)" }}>{highRisk}</div>
                <div className={styles.statLabel}>Due within 24h</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "rgba(251,191,36,0.1)" }}>⏱</div>
                <div className={styles.statVal} style={{ color: "var(--yellow)" }}>{totalH}h</div>
                <div className={styles.statLabel}>Total workload</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "rgba(52,211,153,0.1)" }}>📈</div>
                <div className={styles.statVal} style={{ color: "var(--green)" }}>{score}%</div>
                <div className={styles.statLabel}>Focus score</div>
              </div>
            </div>

            <Card>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Add a task</span>
                <span className={styles.cardChip}>Quick add</span>
              </div>
              <div className={styles.formGrid}>
                <Field label="Task name">
                  <input
                    className={styles.input}
                    placeholder="e.g. Submit machine learning report"
                    value={taskName}
                    onChange={e => setTaskName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTask()}
                  />
                </Field>
                <Field label="Deadline">
                  <input className={styles.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </Field>
                <Field label="Est. hours">
                  <input className={styles.input} type="number" min="0.5" step="0.5" placeholder="4" value={estHours} onChange={e => setEstHours(e.target.value)} />
                </Field>
              </div>
              <Err msg={taskError} />
              <Btn onClick={addTask}>＋ Add task</Btn>
            </Card>

            {taskList.length === 0 ? (
              <Card>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📭</div>
                  <div className={styles.emptyTitle}>No tasks yet</div>
                  <div className={styles.emptyHint}>Add your first task above to start tracking deadlines.</div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className={styles.taskCountStrip}>
                  <span className={styles.taskCountBadge}>{taskList.filter(t=>!t.completed).length}</span> remaining ·&nbsp;
                  <span className={styles.taskCountBadge}>{taskList.filter(t=>t.completed).length}</span> done
                </div>
                <div className={styles.taskList}>
                  {taskList.map(task => {
                    const days = daysUntil(task.deadline);
                    const urgent = days <= 1;
                    const soon   = days <= 3 && days > 1;
                    return (
                      <div
                        key={task.id}
                        className={`${styles.taskItem} ${task.completed ? styles.taskDone : ""} ${urgent ? styles.taskUrgent : soon ? styles.taskSoon : ""}`}
                      >
                        <button
                          className={`${styles.taskCheck} ${task.completed ? styles.taskCheckDone : ""}`}
                          onClick={() => toggleTask(task.id)}
                        >
                          {task.completed ? "✓" : ""}
                        </button>
                        <div className={styles.taskInfo}>
                          <span className={styles.taskName}>{task.name}</span>
                          <div className={styles.taskMeta}>
                            <span className={styles.metaChip}>📅 {task.deadline}</span>
                            <span className={styles.metaChip}>⏱ {task.hours}h</span>
                            <span className={`${styles.metaChip} ${urgent ? styles.metaUrgent : soon ? styles.metaSoon : ""}`}>
                              {days < 0 ? "⚠ Overdue" : days === 0 ? "⚡ Due today" : `${days}d left`}
                            </span>
                          </div>
                        </div>
                        <button className={styles.taskDel} onClick={() => deleteTask(task.id)}>×</button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>)}

          {/* ══ AI PLANNER ══════════════════════════════════════════════════ */}
          {activeTab === "planner" && (<>
            <Card>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Describe your task</span>
                <span className={styles.cardChip}>AI-powered</span>
              </div>
              <Field label="What do you need to accomplish?">
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="e.g. Build a full-stack web app for my university final project by Friday"
                  value={planTask}
                  onChange={e => setPlanTask(e.target.value)}
                />
              </Field>
              <Err msg={planErr} />
              <Btn onClick={generatePlan} loading={planLoad}>Generate action plan →</Btn>
            </Card>

            {plan && (
              <Card className={styles.cardGlow}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Your AI action plan</span>
                  <span className={styles.cardChip}>Ready</span>
                </div>
                <pre className={styles.planOutput}>{plan}</pre>
              </Card>
            )}
          </>)}

          {/* ══ PRIORITY ═══════════════════════════════════════════════════ */}
          {activeTab === "priority" && (<>
            <Card>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Your tasks</span>
                <span className={styles.cardChip}>One per line</span>
              </div>
              <Field label="Paste your task list">
                <textarea
                  className={styles.textarea}
                  rows={6}
                  placeholder={"Submit assignment\nPrepare for technical interview\nReply to client emails\nGym session\nPay rent"}
                  value={priInput}
                  onChange={e => setPriInput(e.target.value)}
                />
              </Field>
              <Err msg={priErr} />
              <Btn onClick={generatePriority} loading={priLoad}>Rank by priority →</Btn>
            </Card>

            {priorities.length > 0 && (
              <div className={styles.priorityList}>
                {priorities.map((item, i) => (
                  <div key={i} className={styles.priorityItem}>
                    <div className={`${styles.rankBadge} ${i === 0 ? styles.r1 : i === 1 ? styles.r2 : i === 2 ? styles.r3 : ""}`}>
                      {item.rank}
                    </div>
                    <div className={styles.priorityBody}>
                      <div className={styles.priorityTask}>
                        <span>{item.task}</span>
                        <Badge level={item.urgency} />
                      </div>
                      <div className={styles.priorityReason}>{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>)}

          {/* ══ RESCUE MODE ════════════════════════════════════════════════ */}
          {activeTab === "rescue" && (<>
            <Card>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Situation assessment</span>
                <span className={styles.cardChip} style={{ background: "var(--red-dim)", color: "var(--red)", borderColor: "rgba(248,113,113,0.2)" }}>Emergency</span>
              </div>
              <Field label="What's the task?">
                <input
                  className={styles.input}
                  placeholder="e.g. Machine learning project report"
                  value={resTask}
                  onChange={e => setResTask(e.target.value)}
                />
              </Field>
              <div className={styles.formRow2}>
                <Field label="Hours you need">
                  <input className={styles.input} type="number" min="1" placeholder="8" value={resNeed} onChange={e => setResNeed(e.target.value)} />
                </Field>
                <Field label="Hours you have">
                  <input className={styles.input} type="number" min="1" placeholder="4" value={resLeft} onChange={e => setResLeft(e.target.value)} />
                </Field>
              </div>
              <Err msg={resErr} />
              <Btn onClick={generateRescue} loading={resLoad} variant="danger">⚡ Activate rescue mode</Btn>
            </Card>

            {resResult && (
              <div className={styles.rescueResult}>
                <div className={styles.rescueHero}>
                  <div className={styles.rescueTopRow}>
                    <div>
                      <div className={styles.rescueMetaLabel}>Risk level</div>
                      <Badge level={resResult.risk} />
                    </div>
                    <div>
                      <div className={styles.rescueMetaLabel}>Success probability</div>
                      <div className={styles.rescueProb}>{resResult.success_probability}</div>
                    </div>
                  </div>
                  {resResult.summary && (
                    <div className={styles.rescueSummaryText}>{resResult.summary}</div>
                  )}
                </div>

                <div className={styles.rescueCols}>
                  <Card>
                    <div className={styles.colTitle}>
                      <span className={styles.dotGreen} /> Focus on this
                    </div>
                    <ul className={styles.bulletList}>
                      {resResult.focus?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </Card>
                  <Card>
                    <div className={styles.colTitle}>
                      <span className={styles.dotRed} /> Postpone / drop
                    </div>
                    <ul className={styles.bulletList}>
                      {resResult.postpone?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </Card>
                </div>

                <Card>
                  <div className={styles.colTitle}>📅 Emergency schedule</div>
                  <div className={styles.scheduleList}>
                    {resResult.schedule?.map((item, i) => (
                      <div key={i} className={styles.scheduleItem}>
                        <span className={styles.scheduleNum}>{i + 1}</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {resResult.tips?.length > 0 && (
                  <Card>
                    <div className={styles.colTitle}>💡 Pro tips</div>
                    <ul className={styles.bulletList}>
                      {resResult.tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </Card>
                )}
              </div>
            )}
          </>)}

          {/* ══ DAILY COACH ════════════════════════════════════════════════ */}
          {activeTab === "coach" && (<>
            <Card>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Today's tasks</span>
                <span className={styles.cardChip}>One per line</span>
              </div>
              <Field label="What's on your plate today?">
                <textarea
                  className={styles.textarea}
                  rows={5}
                  placeholder={"Submit assignment\nTechnical interview prep\nGym session\nCall with mentor\nPrepare project slides"}
                  value={coachInput}
                  onChange={e => setCoachInput(e.target.value)}
                />
              </Field>
              <Err msg={coachErr} />
              <Btn onClick={generateCoach} loading={coachLoad}>Build today's plan →</Btn>
            </Card>

            {coach && (
              <div className={styles.coachResult}>
                <div className={styles.coachHero}>
                  <div className={styles.coachHeroRow}>
                    <div>
                      <div className={styles.coachMetaLabel}>Today's goal</div>
                      <div className={styles.coachGoal}>{coach.today_goal}</div>
                    </div>
                    <div className={styles.coachCompletion}>
                      <div className={styles.coachMetaLabel}>Completion</div>
                      <div className={styles.coachPercent}>{coach.completion_probability}</div>
                    </div>
                  </div>

                  <div className={styles.coachPriorityBanner}>
                    <span className={styles.coachPriorityLabel}>Top priority</span>
                    <span className={styles.coachPriorityVal}>⬆ {coach.highest_priority}</span>
                  </div>

                  <div className={styles.motivationBox}>{coach.motivation}</div>
                </div>

                <div className={styles.coachGrid}>
                  <Card>
                    <div className={styles.colTitle}>📅 Recommended schedule</div>
                    <div className={styles.scheduleList}>
                      {coach.recommended_schedule?.map((item, i) => (
                        <div key={i} className={styles.scheduleItem}>
                          <span className={styles.scheduleNum}>{i + 1}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className={styles.coachRight}>
                    {coach.quick_wins?.length > 0 && (
                      <Card>
                        <div className={styles.colTitle}>⚡ Quick wins</div>
                        <ul className={styles.bulletList}>
                          {coach.quick_wins.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </Card>
                    )}
                    <Card>
                      <div className={styles.colTitle}>🚫 Avoid today</div>
                      <ul className={styles.bulletList}>
                        {coach.avoid?.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </>)}

        </div>
      </main>
    </div>
  );
}
