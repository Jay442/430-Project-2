const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // app.get('/getDomos', mid.requiresLogin, controllers.Domo.getDomos);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  // app.get('/maker', mid.requiresLogin, controllers.Domo.makerPage);
  // app.post('/maker', mid.requiresLogin, controllers.Domo.makeDomo);

  // app.delete('/deleteDomo', mid.requiresLogin, controllers.Domo.deleteDomo);

  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  // Tournament routes
  app.get('/getTournaments', mid.requiresLogin, controllers.Tournament.getTournaments);
  app.get('/maker', mid.requiresLogin, controllers.Tournament.makerPage);
  app.post('/maker', mid.requiresLogin, controllers.Tournament.createTournament);
  app.delete('/deleteTournament', mid.requiresLogin, controllers.Tournament.deleteTournament);
  app.put('/updateMatch', mid.requiresLogin, controllers.Tournament.updateMatch);
};

module.exports = router;
