# Time Capsule Message 🕰️

A modern time capsule application that lets you preserve moments of your life for the future. Instead of just sending a message to the future, freeze who you are right now with predictions, life snapshots, and personal milestones.

## ✨ Features

### Core Functionality
- **Create Time Capsules** - Preserve messages, predictions, and life snapshots
- **Public Message Board** - Share capsules with the community
- **User Profiles** - Click on author names to view their profile and public capsules
- **Memory Timeline** - View your capsules organized by year
- **Archive System** - Automatically archive capsules 2 days after unlock

### Advanced Features
- **"Who Are You Right Now?"** - Comprehensive questionnaire including:
  - Future Predictions (money, dream job, friends, games, AI, location)
  - Life Snapshot (favorite songs, movies, games, goals, daily routine)
- **Milestone Presets** - Quick date selection for:
  - Next Birthday (based on your actual DOB)
  - 1 Year, 5 Years
  - Age 30, Retirement
- **Password Protection** - Lock capsules with passwords for added security
- **Countdown Timers** - Live countdowns for when capsules unlock

### Authentication
- **Email/Password Signup** - Full profile creation with username, DOB, and bio
- **Google Authentication** - Quick signup with profile completion modal
- **Profile Editing** - Update your display name anytime

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A Firebase project with:
  - Authentication enabled (Email/Password and Google)
  - Realtime Database configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CodingJeffRoblox/Time-Capsule-Message.git
cd Time-Capsal-Message/website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## 📱 Tech Stack

- **Frontend**: React 18
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Firebase
  - Authentication
  - Realtime Database
- **Date Handling**: date-fns
- **Build Tool**: Vite

## 🎯 How It Works

### Creating a Capsule
1. Click "Preserve Moment" on the home page
2. Add a title and message
3. Choose an unlock date (or use milestone presets)
4. Optionally enable password protection
5. Toggle "Who Are You Right Now?" to add predictions and life snapshots
6. Choose whether to make it public

### Viewing Capsules
- **Your Capsules**: View on Home page with grid/timeline toggle
- **Public Capsules**: Browse on Message Board
- **Archived Capsules**: Access via Archive link in navigation

### Profile Features
- View your statistics (total, public, private, unlocked, archived)
- Edit your display name
- View your DOB and bio
- Access archived messages

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

Need help? Check out our [SUPPORT.md](SUPPORT.md) or open an issue on GitHub.

## 🌟 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Firebase](https://firebase.google.com/)
- Icons by [Lucide](https://lucide.dev/)

---

Made with ❤️ by CodingJeffRoblox
