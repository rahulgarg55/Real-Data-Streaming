# Real Data Streaming

This project is a task management application built with React, TypeScript, and SKDB. It allows users to manage tasks, mark them as complete or incomplete, and view real-time updates.

## Features

- Add new tasks
- Delete tasks
- Mark tasks as complete or incomplete
- Real-time updates using SKDB
- Search tasks by name
- Pagination for task lists


## Getting Started
Start the server
For your convenience, SkipLabs provides a Docker image via Docker Hub that you can use to run a local SKDB server. Run the following command in a separate terminal window, and you will have a server running at localhost:3586.


docker run -it -p 3586:3586 skiplabs/skdb-dev-server:quickstart

### Prerequisites

- Node.js >= 20.7.0
- npm

### Installation

1. Clone the repository:

```sh
git clone https://github.com/your-username/real-data-streaming.git
cd real-data-streaming

2. Install dependencies:
npm install
Navigate to the services directory and install dependencies:
Running the Application
Start the development server: npm run dev
Open your browser and navigate to http://localhost:3000.