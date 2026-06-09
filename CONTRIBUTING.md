# Contributing to Time Capsule Message 🕰️

Thank you for your interest in contributing to Time Capsule Message! We welcome contributions from the community.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Description**: A clear and concise description of the bug
- **Steps to Reproduce**: Steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Screenshots**: If applicable, add screenshots
- **Environment**: 
  - OS and version
  - Browser and version
  - Node.js version

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Description**: A clear description of the enhancement
- **Use Case**: Why this enhancement would be useful
- **Proposed Solution**: How you envision the enhancement working
- **Alternatives**: Any alternative solutions you've considered

### Pull Requests

1. **Fork the repository**
2. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit your changes** with clear, descriptive messages
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** with a clear description of your changes

## 📋 Development Guidelines

### Code Style

- Use functional React components with hooks
- Follow existing code structure and naming conventions
- Add comments for complex logic
- Keep components small and focused
- Use Tailwind CSS for styling
- Use Lucide React for icons

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(auth): add Google authentication with profile completion modal

- Added Google login button
- Created profile completion modal for new users
- Updated AuthContext to handle profile data
```

### Testing

- Test your changes in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on different screen sizes (mobile, tablet, desktop)
- Ensure all existing features still work
- Test edge cases and error scenarios

## 🏗️ Project Structure

```
website/
├── src/
│   ├── components/     # Reusable components
│   ├── context/       # React context providers
│   ├── pages/         # Page components
│   ├── firebase.js    # Firebase configuration
│   ├── index.css      # Global styles
│   └── main.jsx       # App entry point
├── public/            # Static assets
├── .env               # Environment variables
├── package.json       # Dependencies
└── vite.config.js     # Vite configuration
```

## 🎯 Areas We Need Help With

- **Testing**: Add unit and integration tests
- **Documentation**: Improve code comments and API documentation
- **Accessibility**: Improve WCAG compliance
- **Performance**: Optimize bundle size and loading times
- **Internationalization**: Add support for multiple languages
- **Mobile App**: Create a React Native or PWA version

## 📝 Getting Started for Development

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Firebase configuration
4. Start the dev server: `npm run dev`
5. Make your changes
6. Test thoroughly
7. Submit a pull request

## 🤔 Questions?

Feel free to open an issue for any questions about contributing.

## 📜 Code of Conduct

Please be respectful and constructive in all interactions. We're all here to learn and build something great together.

---

Thank you for contributing! 🎉
