  import { useState } from "react";
  import API from "../services/api";

  function Dashboard() {
    const [task, setTask] = useState("");
    const [plan, setPlan] = useState("");

    const [tasks, setTasks] = useState("");
    const [priority, setPriority] = useState([]);

    const [rescueTask, setRescueTask] = useState("");
    const [hoursNeeded, setHoursNeeded] = useState("");
    const [hoursLeft, setHoursLeft] = useState("");
    const [rescuePlan, setRescuePlan] = useState(null);
    // Daily AI Coach
    const [dailyTasks, setDailyTasks] = useState("");
    const [coach, setCoach] = useState(null);
    // Smart Task Manager
    const [taskName, setTaskName] = useState("");
    const [deadline, setDeadline] = useState("");
    const [estimatedHours, setEstimatedHours] = useState("");

    const [taskList, setTaskList] = useState([]);

    const generatePlan = async () => {
      try {
        const response = await API.post("/plan", {
          task,
        });

        setPlan(response.data.plan);
      } catch (error) {
        console.error(error);
        alert("Error generating plan");
      }
    };

    const generatePriority = async () => {
      try {
        const taskArray = tasks
          .split("\n")
          .filter((t) => t.trim() !== "");

        const response = await API.post("/priority", {
          tasks: taskArray,
        });

        setPriority(response.data.priorities || []);
      } catch (error) {
        console.error(error);
        alert("Error prioritizing tasks");
      }
    };

    const generateRescuePlan = async () => {
      try {
        const response = await API.post("/rescue", {
          task: rescueTask,
          hours_needed: parseInt(hoursNeeded),
          hours_left: parseInt(hoursLeft),
        });

        setRescuePlan(response.data);
      } catch (error) {
        console.error(error);
        alert("Error generating rescue plan");
      }
    };

    const generateCoach = async () => {
      try {
        const taskArray = dailyTasks
          .split("\n")
          .filter((t) => t.trim() !== "");
        const response = await API.post("/daily-coach", {
          tasks: taskArray,
        });
        setCoach(response.data);
      } catch (error) {
        console.error(error);
        alert("Error generating daily action plan");
      }
    };

    const addTask = () => {

  if (
    taskName.trim() === "" ||
    deadline === "" ||
    estimatedHours === ""
  ) {
    alert("Please fill all fields.");
    return;
  }

  const newTask = {
    id: Date.now(),
    name: taskName,
    deadline: deadline,
    hours: estimatedHours,
    completed: false,
  };

  setTaskList([...taskList, newTask]);

  setTaskName("");
  setDeadline("");
  setEstimatedHours("");
};

    return (
      <div
        style={{
          padding: "40px",
          maxWidth: "1000px",
          margin: "auto",
          fontFamily: "Arial",
          color: "white",
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          🚀 LastMinuteAI
        </h1>

        <hr />

        <hr />

<h2>➕ Add New Task</h2>

<input
  type="text"
  placeholder="Task Name"
  value={taskName}
  onChange={(e) => setTaskName(e.target.value)}
/>

<br />
<br />

<input
  type="date"
  value={deadline}
  onChange={(e) => setDeadline(e.target.value)}
/>

<br />
<br />

<input
  type="number"
  placeholder="Estimated Hours"
  value={estimatedHours}
  onChange={(e) => setEstimatedHours(e.target.value)}
/>

<br />
<br />

<button onClick={addTask}>
  Add Task
</button>
<h2>➕ Add New Task</h2>

<input
  type="text"
  placeholder="Task Name"
  value={taskName}
  onChange={(e) => setTaskName(e.target.value)}
/>

<br /><br />

<input
  type="date"
  value={deadline}
  onChange={(e) => setDeadline(e.target.value)}
/>

<br /><br />

<input
  type="number"
  placeholder="Estimated Hours"
  value={estimatedHours}
  onChange={(e) => setEstimatedHours(e.target.value)}
/>

<br /><br />

<button onClick={addTask}>
  Add Task
</button>

{/* 👇 PASTE STEP 1.4 HERE */}

{taskList.length > 0 && (
  <div style={{ marginTop: "30px" }}>
    <h3>📋 My Tasks</h3>

    {taskList.map((task) => (
      <div
        key={task.id}
        style={{
          background: "#1e293b",
          padding: "15px",
          marginBottom: "10px",
          borderRadius: "10px",
        }}
      >
        <h4>{task.name}</h4>

        <p>📅 Deadline: {task.deadline}</p>

        <p>⏳ Estimated Hours: {task.hours}</p>
      </div>
    ))}
  </div>
)}

<hr />

<h2>Task Planner Agent</h2>
        {/* Planner */}

        <h2>Task Planner Agent</h2>

        <input
          type="text"
          placeholder="Enter task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{
            width: "500px",
            padding: "10px",
            marginRight: "10px",
          }}
        />

        <button onClick={generatePlan}>
          Generate Plan
        </button>

        {plan && (
          <div
            style={{
              marginTop: "20px",
              background: "#1e293b",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>📝 AI Plan</h3>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                color: "white",
              }}
            >
              {plan}
            </pre>
          </div>
        )}

        <hr style={{ margin: "40px 0" }} />

        {/* Priority */}

        <h2>Priority Agent</h2>

        <p>Enter one task per line:</p>

        <textarea
          rows="6"
          cols="60"
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
        />

        <br />
        <br />

        <button onClick={generatePriority}>
          Prioritize Tasks
        </button>

        {priority.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h2>📊 AI Priority Analysis</h2>

            {priority.map((item) => (
              <div
                key={item.rank}
                style={{
                  background: "#1e293b",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "15px",
                }}
              >
                <h3>
                  {item.rank === 1
                    ? "🥇"
                    : item.rank === 2
                    ? "🥈"
                    : item.rank === 3
                    ? "🥉"
                    : "📌"}{" "}
                  {item.task}
                </h3>

                <p>{item.reason}</p>
              </div>
            ))}
          </div>
        )}

        <hr style={{ margin: "40px 0" }} />

        {/* Rescue Mode */}

        <h2>🚨 Deadline Rescue Mode</h2>

        <input
          type="text"
          placeholder="Task Name"
          value={rescueTask}
          onChange={(e) => setRescueTask(e.target.value)}
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Hours Needed"
          value={hoursNeeded}
          onChange={(e) => setHoursNeeded(e.target.value)}
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Hours Left"
          value={hoursLeft}
          onChange={(e) => setHoursLeft(e.target.value)}
        />

        <br />
        <br />

        <button onClick={generateRescuePlan}>
          Generate Rescue Plan
        </button>

        {rescuePlan && (
          <div
            style={{
              background: "#1e293b",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "20px",
            }}
          >
            <h3>🚨 Risk Level: {rescuePlan.risk}</h3>

            <h4>✅ Focus On</h4>

            <ul>
              {rescuePlan.focus?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4>❌ Postpone</h4>

            <ul>
              {rescuePlan.postpone?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4>📅 Emergency Schedule</h4>

            <ul>
              {rescuePlan.schedule?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4>
  🎯 Success Probability: {rescuePlan.success_probability}
</h4>
</div>
)}

<hr style={{ margin: "40px 0" }} />

{/* Daily AI Coach */}

<h2>🤖 Today's AI Coach</h2>

<p>Enter today's tasks (one task per line)</p>

<textarea
  rows="6"
  cols="60"
  value={dailyTasks}
  onChange={(e) => setDailyTasks(e.target.value)}
  placeholder={`Assignment Submission
Technical Interview
Gym
Netflix`}
/>

<br />
<br />

<button onClick={generateCoach}>
  Generate Today's Plan
</button>

{coach && (
  <div
    style={{
      background: "#1e293b",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "20px",
    }}
  >
    <h3>🎯 Today's Goal</h3>
    <p>{coach.today_goal}</p>

    <h3>⚠ Highest Priority</h3>
    <p>{coach.highest_priority}</p>

    <h3>📅 Recommended Schedule</h3>

    <ul>
      {coach.recommended_schedule?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>

    <h3>🚫 Avoid</h3>

    <ul>
      {coach.avoid?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>

    <h3>💪 Motivation</h3>
    <p>{coach.motivation}</p>

    <h3>✅ Completion Probability</h3>
    <p>{coach.completion_probability}</p>
  </div>
)}

</div>
);
}

export default Dashboard;