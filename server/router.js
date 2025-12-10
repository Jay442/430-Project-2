const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // app.get('/getDomos', mid.requiresLogin, controllers.Domo.getDomos);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.get('/profile', controllers.Account.profilePage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.post('/changePassword', controllers.Account.changePassword);

  // Tournament routes
  app.get('/getTournaments', mid.requiresLogin, controllers.Tournament.getTournaments);
  app.get('/maker', mid.requiresLogin, controllers.Tournament.makerPage);
  app.post('/maker', mid.requiresLogin, controllers.Tournament.createTournament);
  app.delete('/deleteTournament', mid.requiresLogin, controllers.Tournament.deleteTournament);
  app.put('/updateMatch', mid.requiresLogin, controllers.Tournament.updateMatch);
};

module.exports = router;
