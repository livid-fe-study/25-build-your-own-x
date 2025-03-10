import { Didact } from '../2_react/didact.js'
import { useQuery } from './hook.js'

/** @jsx Didact.createElement */
function TodoList() {
  // State variables
  const { data: tasks = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos?_limit=4',
      )
      return response.json()
    },
  })

  const [inputValue, setInputValue] = Didact.useState('') // Holds the value of the input field
  const [filter, setFilter] = Didact.useState('all') // Holds the current filter type
  const [editTaskId, setEditTaskId] = Didact.useState(null) // Holds the ID of the task being edited

  // Handle input change
  const handleInputChange = (event) => {
    setInputValue(() => event.target.value)
  }

  // Add a new task
  const handleAddTask = async () => {
    if (inputValue.trim() === '') {
      return
    }

    const newTask = {
      title: inputValue,
      completed: false,
    }

    try {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos',
        {
          method: 'POST',
          body: JSON.stringify(newTask),
          headers: {
            'Content-type': 'application/json; charset=UTF-8',
          },
        },
      )
      const addedTask = await response.json()
      setTasks((prevTasks) => [...prevTasks, addedTask])
      setInputValue(() => '')
    } catch (error) {
      console.log('Error adding task:', error)
    }
  }

  // Handle checkbox change for a task
  const handleTaskCheckboxChange = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  // Delete a task
  const handleDeleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  // Edit a task
  const handleEditTask = (taskId) => {
    setEditTaskId(() => taskId)
    const taskToEdit = tasks.find((task) => task.id === taskId)
    setInputValue(() => taskToEdit.title)
  }

  // Update a task
  const handleUpdateTask = async () => {
    if (inputValue.trim() === '') {
      return
    }

    const updatedTask = {
      title: inputValue,
      completed: false,
    }

    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos/${editTaskId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatedTask),
          headers: {
            'Content-type': 'application/json; charset=UTF-8',
          },
        },
      )
      const updatedTaskData = await response.json()
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === editTaskId
            ? { ...task, title: updatedTaskData.title }
            : task,
        ),
      )
      setInputValue(() => '')
      setEditTaskId(() => null)
    } catch (error) {
      console.log('Error updating task:', error)
    }
  }

  // Mark all tasks as completed
  const handleCompleteAll = () => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({ ...task, completed: true })),
    )
  }

  // Clear completed tasks
  const handleClearCompleted = () => {
    setTasks((prevTasks) => prevTasks.filter((task) => !task.completed))
  }

  // Handle filter change
  const handleFilterChange = (filterType) => {
    setFilter(() => filterType)
  }

  // Filter tasks based on the selected filter
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') {
      return true
    }
    if (filter === 'completed') {
      return task.completed
    }
    if (filter === 'uncompleted') {
      return !task.completed
    }
    return true
  })

  // Display loading message while data is being fetched
  if (!tasks) {
    return <div>Loading...</div>
  }

  // Render the todo list
  return (
    <div className="container">
      <div className="todo-app">
        <h2>Todo List</h2>
        <div className="row">
          <i className="fas fa-list-check" />
          <input
            type="text"
            className="add-task"
            id="add"
            placeholder="Add your todo"
            value={inputValue}
            onChange={handleInputChange}
          />
          <button
            type="button"
            id="btn"
            onClick={editTaskId ? handleUpdateTask : handleAddTask}
          >
            {editTaskId ? 'Update' : 'Add'}
          </button>
        </div>

        <div className="mid">
          <i className="fas fa-check-double" />
          <p id="complete-all" onClick={handleCompleteAll}>
            Complete all tasks
          </p>
          <p id="clear-all" onClick={handleClearCompleted}>
            Delete comp tasks
          </p>
        </div>

        <ul id="list">
          {filteredTasks.map((task) => (
            <li key={task.id}>
              <input
                type="checkbox"
                id={`task-${task.id}`}
                data-id={task.id}
                className="custom-checkbox"
                checked={task.completed}
                onChange={() => handleTaskCheckboxChange(task.id)}
              />
              <label htmlFor={`task-${task.id}`}>{task.title}</label>
              <div>
                <img
                  src="https://cdn-icons-png.flaticon.com/128/1159/1159633.png"
                  className="edit"
                  data-id={task.id}
                  onClick={() => handleEditTask(task.id)}
                />
                <img
                  src="https://cdn-icons-png.flaticon.com/128/3096/3096673.png"
                  className="delete"
                  data-id={task.id}
                  onClick={() => handleDeleteTask(task.id)}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="filters">
          <div className="dropdown">
            <button type="button" className="dropbtn">
              Filter
            </button>
            <div className="dropdown-content">
              <a href="#" id="all" onClick={() => handleFilterChange('all')}>
                All
              </a>
              <a
                href="#"
                id="rem"
                onClick={() => handleFilterChange('uncompleted')}
              >
                Uncompleted
              </a>
              <a
                href="#"
                id="com"
                onClick={() => handleFilterChange('completed')}
              >
                Completed
              </a>
            </div>
          </div>

          <div className="completed-task">
            <p>
              Completed:{' '}
              <span id="c-count">
                {tasks.filter((task) => task.completed).length}
              </span>
            </p>
          </div>
          <div className="remaining-task">
            <p>
              <span id="total-tasks">
                Total Tasks: <span id="tasks-counter">{tasks.length}</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const element = <TodoList />
const container = document.getElementById('root')
Didact.render(element, container)
