const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => res.render('login');

const profilePage = (req, res) => {
  if (!req.session.account) {
    return res.redirect('/login');
  }
  return res.render('profile');
};

const logout = (req, res) => {
  req.session.destroy();
  return res.redirect('/');
};

const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }

    req.session.account = Account.toAPI(account);

    return res.json({ redirect: '/maker' });
  });
};

const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    return res.json({ redirect: '/maker' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use!' });
    }
    return res.status(500).json({ error: 'An error occured!' });
  }
};

// To change password must be logged in and reinput password
const changePassword = async (req, res) => {
  if (!req.session.account || !req.session.account.username) {
    return res.status(401).json({ error: 'Not logged in!' });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match!' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from current password!' });
  }

  try {
    const { username } = req.session.account;

    await Account.changePassword(username, currentPassword, newPassword);

    return res.json({
      success: true,
      message: 'Password changed successfully!',
    });
  } catch (error) {
    console.error('Password change error:', error);

    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ error: 'Current password is incorrect!' });
    }

    if (error.message === 'Account not found') {
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    return res.status(500).json({ error: 'An error occurred while changing password!' });
  }
};

module.exports = {
  loginPage,
  profilePage,
  login,
  logout,
  signup,
  changePassword,
};
