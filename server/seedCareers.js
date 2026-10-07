require("dotenv").config();

const connectDB = require("./config/db");
const CareerPath = require("./models/CareerPath");

const careers = [
    {
  title: "Full Stack Developer",
  category: "Web Development",
  description:
    "Build complete web applications by working across both frontend interfaces and backend services, APIs, and databases.",
  technologies: [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "Express.js",
    "MongoDB"
  ],
  requiredSkills: [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "Express.js",
    "MongoDB",
    "REST API",
    "Git"
  ],
  projects: [
    "Build a full-stack authentication system",
    "Create an e-commerce web application",
    "Build a job or internship platform"
  ],
  roadmap: [
    "Learn HTML, CSS and JavaScript",
    "Learn React and frontend development",
    "Learn Node.js and Express.js",
    "Learn MongoDB and database fundamentals",
    "Learn REST APIs and authentication",
    "Build and deploy full-stack projects"
  ]
},
  {
    title: "Frontend Developer",
    category: "Web Development",
    description:
      "Frontend developers build the user-facing part of websites and web applications. They work with interfaces, browser technologies, APIs, and responsive design.",

    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "TypeScript",
      "Git",
    ],

    requiredSkills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Git",
      "REST API",
    ],

    projects: [
      "Responsive portfolio website",
      "E-commerce frontend",
      "Dashboard with API integration",
    ],

    roadmap: [
      "Learn HTML, CSS and responsive design",
      "Build a strong JavaScript foundation",
      "Learn React and component-based development",
      "Learn REST APIs and asynchronous JavaScript",
      "Learn Git and GitHub",
      "Build 2–3 complete projects",
    ],
  },

  {
    title: "Backend Developer",
    category: "Web Development",
    description:
      "Backend developers build the server-side systems that power applications, including APIs, databases, authentication, and business logic.",

    technologies: [
      "Node.js",
      "Express.js",
      "Python",
      "MongoDB",
      "MySQL",
      "REST API",
      "Git",
    ],

    requiredSkills: [
      "JavaScript",
      "Node.js",
      "Express.js",
      "MongoDB",
      "REST API",
      "Git",
    ],

    projects: [
      "Authentication API",
      "E-commerce backend",
      "REST API for a web application",
    ],

    roadmap: [
      "Learn a backend programming language",
      "Understand HTTP and REST APIs",
      "Learn databases and CRUD operations",
      "Build authentication and authorization",
      "Learn backend security fundamentals",
      "Build and deploy backend projects",
    ],
  },

  {
    title: "Game Developer",
    category: "Game Development",
    description:
      "Game developers create interactive games using programming, game engines, graphics, physics, audio, and gameplay systems.",

    technologies: [
      "C#",
      "Unity",
      "C++",
      "Unreal Engine",
      "Blender",
      "Git",
    ],

    requiredSkills: [
      "Programming",
      "C#",
      "Game Engine",
      "Object-Oriented Programming",
      "Git",
    ],

    projects: [
      "2D platformer",
      "Puzzle game",
      "Simple 3D game",
    ],

    roadmap: [
      "Learn programming fundamentals",
      "Learn object-oriented programming",
      "Choose Unity or Unreal Engine",
      "Build a small 2D game",
      "Learn game physics and gameplay systems",
      "Build and publish a complete game",
    ],
  },

  {
    title: "AI / ML Engineer",
    category: "Artificial Intelligence",
    description:
      "AI and ML engineers develop systems that use data and machine learning techniques to solve prediction, classification, automation, and other computational problems.",

    technologies: [
      "Python",
      "NumPy",
      "Pandas",
      "Scikit-learn",
      "TensorFlow",
      "PyTorch",
      "Git",
    ],

    requiredSkills: [
      "Python",
      "Mathematics",
      "Statistics",
      "Machine Learning",
      "Data Processing",
      "Git",
    ],

    projects: [
      "House price prediction",
      "Image classification system",
      "Recommendation system",
    ],

    roadmap: [
      "Build strong Python fundamentals",
      "Learn NumPy and Pandas",
      "Learn mathematics and statistics for ML",
      "Study machine learning algorithms",
      "Build and evaluate ML models",
      "Learn a deep learning framework",
      "Build practical AI projects",
    ],
  },

  {
    title: "Data Analyst",
    category: "Data",
    description:
      "Data analysts work with data to identify patterns, create reports, build dashboards, and communicate insights that support business decisions.",

    technologies: [
      "Python",
      "SQL",
      "Excel",
      "Power BI",
      "Pandas",
    ],

    requiredSkills: [
      "SQL",
      "Excel",
      "Data Analysis",
      "Statistics",
      "Python",
      "Data Visualization",
    ],

    projects: [
      "Sales analysis dashboard",
      "Customer behavior analysis",
      "Business performance report",
    ],

    roadmap: [
      "Learn spreadsheets and data cleaning",
      "Learn SQL",
      "Study statistics fundamentals",
      "Learn Python for data analysis",
      "Learn data visualization",
      "Build dashboards and analysis projects",
    ],
  },

  {
    title: "Cybersecurity Analyst",
    category: "Cybersecurity",
    description:
      "Cybersecurity professionals help protect systems, networks, applications, and data by identifying vulnerabilities, monitoring threats, and responding to security incidents.",

    technologies: [
      "Linux",
      "Python",
      "Networking",
      "Wireshark",
      "Burp Suite",
      "Git",
    ],

    requiredSkills: [
      "Networking",
      "Linux",
      "Cybersecurity Fundamentals",
      "Python",
      "Security Tools",
    ],

    projects: [
      "Network monitoring project",
      "Web security testing lab",
      "Security log analysis tool",
    ],

    roadmap: [
      "Learn computer networking",
      "Learn Linux fundamentals",
      "Study operating system and security fundamentals",
      "Learn common vulnerabilities",
      "Practice using security tools",
      "Build security projects in a legal lab environment",
    ],
  },

  {
    title: "Cloud / DevOps Engineer",
    category: "Cloud & Infrastructure",
    description:
      "Cloud and DevOps engineers work on deployment, infrastructure, automation, monitoring, and reliable delivery of software systems.",

    technologies: [
      "Linux",
      "Docker",
      "AWS",
      "GitHub Actions",
      "Kubernetes",
      "Git",
    ],

    requiredSkills: [
      "Linux",
      "Networking",
      "Git",
      "Docker",
      "Cloud Fundamentals",
      "CI/CD",
    ],

    projects: [
      "Dockerized web application",
      "CI/CD deployment pipeline",
      "Cloud-hosted application",
    ],

    roadmap: [
      "Learn Linux and networking",
      "Learn Git and GitHub",
      "Learn Docker",
      "Understand CI/CD",
      "Learn cloud fundamentals",
      "Deploy and monitor applications",
    ],
  },

  {
    title: "Mobile Developer",
    category: "Mobile Development",
    description:
      "Mobile developers build applications for smartphones and tablets, working with user interfaces, APIs, local storage, and mobile-specific features.",

    technologies: [
      "React Native",
      "Flutter",
      "Dart",
      "Java",
      "Kotlin",
      "Git",
    ],

    requiredSkills: [
      "Programming",
      "Mobile Development",
      "UI Development",
      "REST API",
      "Git",
    ],

    projects: [
      "Expense tracker app",
      "Weather application",
      "Task management app",
    ],

    roadmap: [
      "Learn programming fundamentals",
      "Choose a mobile development framework",
      "Learn mobile UI development",
      "Learn API integration",
      "Learn local storage",
      "Build and publish a complete mobile application",
    ],
  },
];

const seedCareers = async () => {
  try {
    await connectDB();

    const operations = careers.map((career) => ({
      updateOne: {
        filter: { title: career.title },
        update: { $set: career },
        upsert: true,
      },
    }));

    const result = await CareerPath.bulkWrite(operations);

    process.exit(0);
  } catch (error) {
    console.error("Career seed error:", error);
    process.exit(1);
  }
};

seedCareers();