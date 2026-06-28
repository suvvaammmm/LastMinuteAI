import { useState, useEffect } from "react";
import API from "../services/api";
import styles from "./Dashboard.module.css";

// ─── Small reusable components ────────────────────────────────────────────────

function Spinner() {
  return <span className={styles.spinner} aria-label="Loading" />;
}

function Badge({ level }) {
  const map = {
    HIGH: { label: "High", cls: styles.badgeRed },
    MEDIUM: { label: "Medium", cls: styles.badgeYellow },
    LOW: { label: "Low", cls: styles.badgeGreen },
    CRITICAL: { label: "Critical", cls: styles.badgeCritical },
    ON_TRACK: { label: "On Track", cls: styles.badgeGreen },
  };
  const b = map[level] || map.MEDIUM;
  return <span className={`${styles.badge} ${b.cls}`}>{b.label}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionIcon}>{icon}</span>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={styles.textarea} {...props} />
    </div>
  );
}

function PrimaryButton({ onClick, loading, children, variant = "primary" }) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn_${variant}`]}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return <div className={styles.errorMsg}>⚠ {message}</div>;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "tasks", label: "My Tasks", icon: "◈" },
  { id: "planner", label: "Task Planner", icon: "⊞" },
  { id: "priority", label: "Prioritize", icon: "↑" },
  { id: "rescue", label: "Rescue Mode", icon: "⚡" },
  { id: "coach", label: "Daily Coach", icon: "◉" },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("tasks");

  // Task Manager state
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [taskList, setTaskList] = useState([]);
  const [taskError, setTaskError] = useState("");

  // Dashboard Statistics
  const pendingTasks = taskList.filter(task => !task.completed).length;
  const totalHours = taskList.reduce(
    (sum, task) => sum + Number(task.hours),
    0
  );
  const today = new Date();
  const highRiskTasks = taskList.filter(task => {
    const dueDate = new Date(task.deadline);
    const diff =
      (dueDate - today) / (1000 * 60 * 60 * 24);
    return diff <= 1 && !task.completed;
  }).length;

  const productivityScore = Math.max(
    0,
    100 - highRiskTasks * 10
  );

  <Card style={{ marginBottom: "25px" }}>
  <h2>🤖 AI Productivity Coach</h2>

  <pre
    style={{
      whiteSpace: "pre-wrap",
      fontSize: "16px",
      lineHeight: "1.6",
    }}
  >
    {aiSummary}
  </pre>
</Card>

  // Planner state
  const [planTask, setPlanTask] = useState("");
  const [plan, setPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");

  const [aiSummary, setAiSummary] = useState("");

  // Priority state
  const [priorityInput, setPriorityInput] = useState("");
  const [priorities, setPriorities] = useState([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityError, setPriorityError] = useState("");

  // Rescue state
  const [rescueTask, setRescueTask] = useState("");
  const [hoursNeeded, setHoursNeeded] = useState("");
  const [hoursLeft, setHoursLeft] = useState("");
  const [rescueResult, setRescueResult] = useState(null);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [rescueError, setRescueError] = useState("");

  // Coach state
  const [coachInput, setCoachInput] = useState("");
  const [coach, setCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");

  // ── Task Manager handlers ──────────────────────────────────────────────────

  const addTask = () => {
    setTaskError("");
    if (!taskName.trim() || !deadline || !estimatedHours) {
      setTaskError("Please fill in all fields before adding a task.");
      return;
    }
    if (Number(estimatedHours) <= 0) {
      setTaskError("Estimated hours must be a positive number.");
      return;
    }
    setTaskList((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: taskName.trim(),
        deadline,
        hours: Number(estimatedHours),
        completed: false,
      },
    ]);
    setTaskName("");
    setDeadline("");
    setEstimatedHours("");
  };

  const toggleTask = (id) =>
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const deleteTask = (id) =>
    setTaskList((prev) => prev.filter((t) => t.id !== id));

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ── AI agent handlers ──────────────────────────────────────────────────────

  const generatePlan = async () => {
    if (!planTask.trim()) { setPlanError("Enter a task to plan."); return; }
    setPlanError(""); setPlanLoading(true); setPlan("");
    try {
      const res = await API.post("/plan", { task: planTask });
      setPlan(res.data.plan);
    } catch (e) {
      setPlanError(e.message);
    } finally {
      setPlanLoading(false);
    }
  };

  const generatePriority = async () => {
    const taskArray = priorityInput.split("\n").map((t) => t.trim()).filter(Boolean);
    if (taskArray.length < 2) { setPriorityError("Enter at least 2 tasks to prioritize."); return; }
    setPriorityError(""); setPriorityLoading(true); setPriorities([]);
    try {
      const res = await API.post("/priority", { tasks: taskArray });
      setPriorities(res.data.priorities || []);
    } catch (e) {
      setPriorityError(e.message);
    } finally {
      setPriorityLoading(false);
    }
  };

  const generateRescue = async () => {
    if (!rescueTask.trim() || !hoursNeeded || !hoursLeft) {
      setRescueError("Fill in all fields."); return;
    }
    setRescueError(""); setRescueLoading(true); setRescueResult(null);
    try {
      const res = await API.post("/rescue", {
        task: rescueTask,
        hours_needed: parseInt(hoursNeeded),
        hours_left: parseInt(hoursLeft),
      });
      setRescueResult(res.data);
    } catch (e) {
      setRescueError(e.message);
    } finally {
      setRescueLoading(false);
    }
  };

  const generateCoach = async () => {
    const taskArray = coachInput.split("\n").map((t) => t.trim()).filter(Boolean);
    if (taskArray.length === 0) { setCoachError("Enter at least one task."); return; }
    setCoachError(""); setCoachLoading(true); setCoach(null);
    try {
      const res = await API.post("/daily-coach", { tasks: taskArray });
      setCoach(res.data);
    } catch (e) {
      setCoachError(e.message);
    } finally {
      setCoachLoading(false);
    }
  };

  useEffect(() => {
  if (taskList.length > 0) {
    generateAISummary();
  }
}, [taskList]);

  const generateAISummary = async () => {
  try {
    if (taskList.length === 0) {
      setAiSummary("No tasks added yet.");
      return;
    }

    const response = await API.post("/daily-coach", {
      tasks: taskList.map((task) => task.name),
    });

    const data = response.data;

    const summary = `
🎯 Today's Goal:
${data.today_goal}

⚠ Highest Priority:
${data.highest_priority}

💪 Motivation:
${data.motivation}
`;

    setAiSummary(summary);

  } catch (err) {
    console.log(err);
  }
};

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>⚡</span>
          <div>
            <div className={styles.brandName}>LastMinute<span>AI</span></div>
            <div className={styles.brandTag}>Your deadline wingman</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.statusDot} />
          <span>API connected</span>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* ── My Tasks ─────────────────────────────────────────────────── */}
        {activeTab === "tasks" && (
          <div className={styles.tabContent}>
            <SectionHeader
  icon="◈"
  title="Task Manager"
  subtitle="Track what you need to do and when it's due."
/>

{/* Dashboard Summary */}

<div className={styles.statsGrid}>

  <Card className={styles.statCard}>
    <h2>{pendingTasks}</h2>
    <p>Pending Tasks</p>
  </Card>

  <Card className={styles.statCard}>
    <h2>{highRiskTasks}</h2>
    <p>High Risk</p>
  </Card>

  <Card className={styles.statCard}>
    <h2>{totalHours}</h2>
    <p>Total Hours</p>
  </Card>

  <Card className={styles.statCard}>
    <h2>{productivityScore}%</h2>
    <p>AI Productivity</p>
  </Card>

</div>

<Card>  
              <h3 className={styles.cardTitle}>Add New Task</h3>
              <div className={styles.formRow}>
                <Input
                  label="Task name"
                  placeholder="e.g. Finish assignment"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <Input
                  label="Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <Input
                  label="Est. hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="4"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
              <ErrorMessage message={taskError} />
              <PrimaryButton onClick={addTask}>Add Task</PrimaryButton>
            </Card>

            {taskList.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>◫</span>
                <p>No tasks yet. Add one above to get started.</p>
              </div>
            ) : (
              <div className={styles.taskList}>
                <div className={styles.taskListHeader}>
                  <h3>{taskList.filter((t) => !t.completed).length} remaining · {taskList.filter((t) => t.completed).length} done</h3>
                </div>
                {taskList.map((task) => {
                  const days = daysUntil(task.deadline);
                  const urgent = days <= 1;
                  const soon = days <= 3 && days > 1;
                  return (
                    <div
                      key={task.id}
                      className={`${styles.taskItem} ${task.completed ? styles.taskDone : ""} ${urgent ? styles.taskUrgent : soon ? styles.taskSoon : ""}`}
                    >
                      <button
                        className={`${styles.taskCheck} ${task.completed ? styles.taskCheckDone : ""}`}
                        onClick={() => toggleTask(task.id)}
                        title="Mark complete"
                      >
                        {task.completed ? "✓" : ""}
                      </button>
                      <div className={styles.taskInfo}>
                        <span className={styles.taskName}>{task.name}</span>
                        <div className={styles.taskMeta}>
                          <span>📅 {task.deadline}</span>
                          <span>·</span>
                          <span>⏱ {task.hours}h</span>
                          <span>·</span>
                          <span className={urgent ? styles.metaUrgent : soon ? styles.metaSoon : ""}>
                            {days < 0 ? "⚠ Overdue" : days === 0 ? "Due today!" : `${days}d left`}
                          </span>
                        </div>
                      </div>
                      <button className={styles.taskDelete} onClick={() => deleteTask(task.id)} title="Remove task">×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Planner Agent ─────────────────────────────────────────── */}
        {activeTab === "planner" && (
          <div className={styles.tabContent}>
            <SectionHeader
              icon="⊞"
              title="Task Planner"
              subtitle="Describe any task and get a step-by-step action plan."
            />

            <Card>
              <Textarea
                label="What do you need to accomplish?"
                placeholder="e.g. Build a full-stack web app for my university project"
                rows={3}
                value={planTask}
                onChange={(e) => setPlanTask(e.target.value)}
              />
              <ErrorMessage message={planError} />
              <PrimaryButton onClick={generatePlan} loading={planLoading}>
                Generate Plan
              </PrimaryButton>
            </Card>

            {plan && (
              <Card className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultLabel}>AI Action Plan</span>
                </div>
                <pre className={styles.planText}>{plan}</pre>
              </Card>
            )}
          </div>
        )}

        {/* ── Priority Agent ─────────────────────────────────────────── */}
        {activeTab === "priority" && (
          <div className={styles.tabContent}>
            <SectionHeader
              icon="↑"
              title="Priority Ranker"
              subtitle="Paste your task list and AI will rank them by urgency and impact."
            />

            <Card>
              <Textarea
                label="Your tasks (one per line)"
                placeholder={"Submit assignment\nPrepare for interview\nReply to emails\nGo to gym"}
                rows={6}
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
              />
              <ErrorMessage message={priorityError} />
              <PrimaryButton onClick={generatePriority} loading={priorityLoading}>
                Rank Tasks
              </PrimaryButton>
            </Card>

            {priorities.length > 0 && (
              <div className={styles.priorityList}>
                {priorities.map((item, i) => (
                  <Card key={i} className={styles.priorityCard}>
                    <div className={styles.priorityRank}>
                      <span className={styles.rankNumber}>{item.rank}</span>
                    </div>
                    <div className={styles.priorityInfo}>
                      <div className={styles.priorityTop}>
                        <span className={styles.priorityTask}>{item.task}</span>
                        <Badge level={item.urgency || (i === 0 ? "HIGH" : i === 1 ? "MEDIUM" : "LOW")} />
                      </div>
                      <p className={styles.priorityReason}>{item.reason}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Rescue Mode ───────────────────────────────────────────── */}
        {activeTab === "rescue" && (
          <div className={styles.tabContent}>
            <SectionHeader
              icon="⚡"
              title="Deadline Rescue"
              subtitle="Running out of time? Get an emergency action plan instantly."
            />

            <Card>
              <Input
                label="What's the task?"
                placeholder="e.g. Machine Learning project report"
                value={rescueTask}
                onChange={(e) => setRescueTask(e.target.value)}
              />
              <div className={styles.formRow}>
                <Input
                  label="Hours you need"
                  type="number"
                  min="1"
                  placeholder="8"
                  value={hoursNeeded}
                  onChange={(e) => setHoursNeeded(e.target.value)}
                />
                <Input
                  label="Hours you have"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={hoursLeft}
                  onChange={(e) => setHoursLeft(e.target.value)}
                />
              </div>
              <ErrorMessage message={rescueError} />
              <PrimaryButton onClick={generateRescue} loading={rescueLoading} variant="primary_danger">
                ⚡ Activate Rescue Mode
              </PrimaryButton>
            </Card>

            {rescueResult && (
              <div className={styles.rescueResult}>
                <Card className={styles.rescueSummary}>
                  <div className={styles.rescueTop}>
                    <div>
                      <div className={styles.riskLabel}>Risk Level</div>
                      <Badge level={rescueResult.risk} />
                    </div>
                    <div>
                      <div className={styles.riskLabel}>Success Chance</div>
                      <span className={styles.probability}>{rescueResult.success_probability}</span>
                    </div>
                  </div>
                  {rescueResult.summary && (
                    <p className={styles.rescueSummaryText}>{rescueResult.summary}</p>
                  )}
                </Card>

                <div className={styles.rescueCols}>
                  <Card>
                    <h4 className={styles.rescueColTitle}>
                      <span className={styles.greenDot}>●</span> Focus on this
                    </h4>
                    <ul className={styles.rescueList}>
                      {rescueResult.focus?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </Card>

                  <Card>
                    <h4 className={styles.rescueColTitle}>
                      <span className={styles.redDot}>●</span> Postpone this
                    </h4>
                    <ul className={styles.rescueList}>
                      {rescueResult.postpone?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </Card>
                </div>

                <Card>
                  <h4 className={styles.rescueColTitle}>📅 Emergency Schedule</h4>
                  <div className={styles.scheduleList}>
                    {rescueResult.schedule?.map((item, i) => (
                      <div key={i} className={styles.scheduleItem}>
                        <span className={styles.scheduleIdx}>{i + 1}</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {rescueResult.tips && (
                  <Card>
                    <h4 className={styles.rescueColTitle}>💡 Pro Tips</h4>
                    <ul className={styles.rescueList}>
                      {rescueResult.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Daily Coach ───────────────────────────────────────────── */}
        {activeTab === "coach" && (
          <div className={styles.tabContent}>
            <SectionHeader
              icon="◉"
              title="Daily AI Coach"
              subtitle="Get a personalized daily action plan and motivation boost."
            />

            <Card>
              <Textarea
                label="What's on your plate today? (one task per line)"
                placeholder={"Submit assignment\nTechnical interview prep\nGym session\nCall with mentor"}
                rows={5}
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
              />
              <ErrorMessage message={coachError} />
              <PrimaryButton onClick={generateCoach} loading={coachLoading}>
                Build Today's Plan
              </PrimaryButton>
            </Card>

            {coach && (
              <div className={styles.coachResult}>
                <Card className={styles.coachHero}>
                  <div className={styles.coachHeroRow}>
                    <div>
                      <div className={styles.coachLabel}>Today's Goal</div>
                      <p className={styles.coachGoal}>{coach.today_goal}</p>
                    </div>
                    <div className={styles.coachProb}>
                      <div className={styles.coachLabel}>Completion</div>
                      <span className={styles.coachProbNum}>{coach.completion_probability}</span>
                    </div>
                  </div>
                  <div className={styles.coachPriorityRow}>
                    <span className={styles.coachLabel}>Top Priority</span>
                    <span className={styles.coachPriority}>⬆ {coach.highest_priority}</span>
                  </div>
                  <div className={styles.motivationBox}>
                    <span className={styles.motivationQuote}>"</span>
                    <p>{coach.motivation}</p>
                  </div>
                </Card>

                <div className={styles.coachCols}>
                  <Card>
                    <h4 className={styles.rescueColTitle}>📅 Recommended Schedule</h4>
                    <div className={styles.scheduleList}>
                      {coach.recommended_schedule?.map((item, i) => (
                        <div key={i} className={styles.scheduleItem}>
                          <span className={styles.scheduleIdx}>{i + 1}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className={styles.coachRight}>
                    {coach.quick_wins && (
                      <Card>
                        <h4 className={styles.rescueColTitle}>⚡ Quick Wins</h4>
                        <ul className={styles.rescueList}>
                          {coach.quick_wins.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </Card>
                    )}

                    <Card>
                      <h4 className={styles.rescueColTitle}>🚫 Avoid Today</h4>
                      <ul className={styles.rescueList}>
                        {coach.avoid?.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
