# Support 💬

Need help with Time Capsule Message? Here's how to get support.

## 📚 Documentation

- **[README.md](README.md)** - Project overview and getting started guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](LICENSE)** - Project license information

## ❓ Common Issues

### Authentication Issues

**Problem**: Can't log in or sign up
- **Solution**: Make sure Firebase Authentication is properly configured in your Firebase console
- **Solution**: Check that Email/Password and Google sign-in providers are enabled
- **Solution**: Verify your environment variables are set correctly in `.env` file

**Problem**: Google login not working
- **Solution**: Ensure Google OAuth is enabled in Firebase Console
- **Solution**: Check that the authorized domain is added (localhost for development)

### Database Issues

**Problem**: Capsules not saving
- **Solution**: Verify Firebase Realtime Database is enabled
- **Solution**: Check that your database rules allow read/write access
- **Solution**: Ensure your Firebase configuration is correct

**Problem**: Public capsules not showing on Message Board
- **Solution**: Check that capsules have `isPublic: true` when created
- **Solution**: Verify database rules allow public read access

### Development Issues

**Problem**: Dependencies not installing
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again
- **Solution**: Ensure you're using Node.js v16 or higher

**Problem**: Build errors
- **Solution**: Clear Vite cache: `rm -rf node_modules/.vite`
- **Solution**: Restart the development server

## 🐛 Reporting Bugs

If you encounter a bug not listed above, please:

1. **Search existing issues** - Check if the bug has already been reported
2. **Create a new issue** with the following information:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, Node.js version)

## 💡 Feature Requests

Have an idea for improving Time Capsule Message?

1. **Check existing issues** - See if someone already suggested it
2. **Create a new issue** with:
   - Clear title describing the feature
   - Detailed description of the feature
   - Use case - why this feature would be useful
   - Proposed implementation (if you have ideas)

## 📞 Getting Help

### GitHub Issues
- Open an issue for bugs, questions, or feature requests
- We'll respond as soon as possible

### Community
- Check existing discussions for common questions
- Help others by answering questions in issues

## 🔧 Troubleshooting Steps

Before asking for help, try these steps:

1. **Restart the development server** - Sometimes a simple restart fixes issues
2. **Clear browser cache** - Old cached data can cause problems
3. **Check console logs** - Browser console (F12) often shows error details
4. **Verify environment variables** - Ensure `.env` file is configured correctly
5. **Update dependencies** - Run `npm update` to get the latest versions
6. **Reinstall dependencies** - Delete `node_modules` and run `npm install`

## 📧 Contact

For urgent issues or security concerns, please open a GitHub issue with the "security" label.

## 🙏 Thank You

Thank you for using Time Capsule Message! We appreciate your patience as we work to improve the project.

---

Remember: The best way to get help is to provide clear, detailed information about what you're experiencing.
