//
//  * XaloraClient
// 
//  * Xalora 0.1, Codename Oreo
//  * Copyright SrydenCloud Limited & Pine Platforms Ltd
//
"use strict";

// Load packages.

const fs = require("fs");
const fetch = require('node-fetch');
const chalk = require("chalk");
const axios = require("axios");

global.Buffer = global.Buffer || require('buffer').Buffer;

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return new Buffer.from(str, 'binary').toString('base64');
  };
}
if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return new Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}

// Load settings.

const settings = require("./settings.json");

const themesettings = {
  index: "index.ejs",
  notfound: "index.ejs",
  redirect: {},
  pages: {},
  mustbeloggedin: [],
  mustbeadmin: [],
  variables: {}
};

module.exports.renderdataeval =
  `(async () => {
   let newsettings = JSON.parse(require("fs").readFileSync("./settings.json"));
 
    let renderdata = {
      req: req,
      settings: newsettings,
      userinfo: req.session.userinfo,
      packagename: req.session.userinfo ? await db.get("package-" + req.session.userinfo.id) ? await db.get("package-" + req.session.userinfo.id) : newsettings.api.client.packages.default : null,
      extraresources: !req.session.userinfo ? null : (await db.get("extra-" + req.session.userinfo.id) ? await db.get("extra-" + req.session.userinfo.id) : {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0
      }),
	  	packages: req.session.userinfo ? newsettings.api.client.packages.list[await db.get("package-" + req.session.userinfo.id) ? await db.get("package-" + req.session.userinfo.id) : newsettings.api.client.packages.default] : null,
      coins: newsettings.api.client.coins.enabled == true ? (req.session.userinfo ? (await db.get("coins-" + req.session.userinfo.id) ? await db.get("coins-" + req.session.userinfo.id) : 0) : null) : null,
      pterodactyl: req.session.pterodactyl,
      theme: theme.name,
      extra: theme.settings.variables,
	    db: db
    };
    return renderdata;
  })();`;

// Load database

const Keyv = require("keyv");
const db = new Keyv(settings.database);

db.on('error', err => {
  console.log(chalk.red("[Xalora] An error has occured when attempting to access the database."))
});

module.exports.db = db;

// Load express addons.

const express = require("express");
const app = express();
require('express-ws')(app);

const ejs = require("ejs");
const session = require("express-session");
const indexjs = require("./index.js");

// Load the website.

module.exports.app = app;

app.use(session({
  secret: settings.website.secret,
  resave: false,
  saveUninitialized: false
  }));

app.use(express.json({
  inflate: true,
  limit: '500kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}));

// Load the console

const listener = app.listen(settings.website.port, async function() {
  console.clear();
  console.log(chalk.gray("  "));
  console.log(chalk.gray("  ") + chalk.bgBlue("  APPLICATION IS ONLINE  "));
  console.log(chalk.gray("  "));
  console.log(chalk.gray("  ") + chalk.cyan("[Xalora]") + chalk.white(" Checking for updates..."));

  try {
    let newsettings = JSON.parse(require("fs").readFileSync("./settings.json"));;
    const response = await axios.get(`https://api.github.com/repos/OvernodeProjets/Heliactyl-fixed/releases/latest`);
    const latestVersion = response.data.tag_name;

    if (latestVersion !== newsettings.version) {
      console.log(chalk.gray("  ") + chalk.cyan("[Xalora]") + chalk.yellow(" This is a Beta Release!"));
      console.log(chalk.gray("  ") + chalk.cyan("[Xalora]") + chalk.white(` Current Version: ${newsettings.version}`));
    } else {
      console.log(chalk.gray("  ") + chalk.cyan("[Xalora]") + chalk.white(" Your application is up-to-date."));
    }
  } catch (error) {
    console.error(chalk.gray("  ") + chalk.cyan("[Xalora]") + chalk.red(" Error checking for updates:"), error.message);
  }
  console.log(chalk.gray("  ") + chalk.cyan("[Xalora]") + chalk.white(" You can now access the dashboard at ") + chalk.underline(settings.api.client.oauth2.link + "/"));

});

var cache = false;
app.use(function(req, res, next) {
  let manager = (JSON.parse(fs.readFileSync("./settings.json").toString())).api.client.ratelimits;
  if (manager[req._parsedUrl.pathname]) {
    if (cache == true) {
      setTimeout(async () => {
        let allqueries = Object.entries(req.query);
        let querystring = "";
        for (let query of allqueries) {
          querystring = querystring + "&" + query[0] + "=" + query[1];
        }
        querystring = "?" + querystring.slice(1);
        res.redirect((req._parsedUrl.pathname.slice(0, 1) == "/" ? req._parsedUrl.pathname : "/" + req._parsedUrl.pathname) + querystring);
      }, 1000);
      return;
    } else {
      cache = true;
      setTimeout(async () => {
        cache = false;
      }, 1000 * manager[req._parsedUrl.pathname]);
    }
  };
  next();
});

// Load the API files.

let apifiles = fs.readdirSync('./api').filter(file => file.endsWith('.js'));

apifiles.forEach(file => {
  let apifile = require(`./api/${file}`);
	apifile.load(app, db);
});

 // Load route

app.all("*", async (req, res) => {
  if (req.session.pterodactyl && req.session.pterodactyl.id !== await db.get("users-" + req.session.userinfo.id)) {
    return res.redirect("/login?prompt=none");
  }

  let theme = indexjs.get(req);
  
  if (theme.settings.mustbeloggedin.includes(req._parsedUrl.pathname)) if (!req.session.userinfo || !req.session.pterodactyl) return res.redirect("/login" + (req._parsedUrl.pathname.slice(0, 1) == "/" ? "?redirect=" + req._parsedUrl.pathname.slice(1) : ""));
  if (theme.settings.mustbeadmin.includes(req._parsedUrl.pathname)) {
    ejs.renderFile(
      `./themes/${theme.name}/${theme.settings.notfound}`, 
      await eval(indexjs.renderdataeval),
      null,
    async function (err, str) {
      delete req.session.newaccount;
      delete req.session.password;
      if (!req.session.userinfo || !req.session.pterodactyl) {
        if (err) {
          console.log(chalk.red(`[Xalora] An error has occured on path ${req._parsedUrl.pathname}:`));
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        res.status(200);
        return res.send(str);
      };

      let cacheaccount = await fetch(
        settings.pterodactyl.domain + "/api/application/users/" + (await db.get("users-" + req.session.userinfo.id)) + "?include=servers",
        {
          method: "get",
          headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${settings.pterodactyl.key}` }
        }
      );
      if (await cacheaccount.statusText == "Not Found") {
        if (err) {
          console.log(chalk.red(`[Xalora] An error has occured on path ${req._parsedUrl.pathname}:`));
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        return res.send(str);
      };
      let cacheaccountinfo = JSON.parse(await cacheaccount.text());
    
      req.session.pterodactyl = cacheaccountinfo.attributes;
      if (cacheaccountinfo.attributes.root_admin !== true) {
        if (err) {
          console.log(chalk.red(`[Xalora] An error has occured on path ${req._parsedUrl.pathname}:`));
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        return res.send(str);
      };

      ejs.renderFile(
        `./themes/${theme.name}/${theme.settings.pages[req._parsedUrl.pathname.slice(1)] ? theme.settings.pages[req._parsedUrl.pathname.slice(1)] : theme.settings.notfound}`, 
        await eval(indexjs.renderdataeval),
        null,
      function (err, str) {
        delete req.session.newaccount;
        delete req.session.password;
        if (err) {
          console.log(`[Xalora] An error has occured on path ${req._parsedUrl.pathname}:`);
          console.log(err);
          return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
        };
        res.status(200);
        res.send(str);
      });
    });
    return;
  };
    const data = await eval(indexjs.renderdataeval)
  ejs.renderFile(
    `./themes/${theme.name}/${theme.settings.pages[req._parsedUrl.pathname.slice(1)] ? theme.settings.pages[req._parsedUrl.pathname.slice(1)] : theme.settings.notfound}`, 
    data,
    null,
  function (err, str) {
    delete req.session.newaccount;
    delete req.session.password;
    if (err) {
      console.log(chalk.red(`[Xalora] An error has occured on path ${req._parsedUrl.pathname}:`));
      console.log(err);
      return res.send("An error has occured while attempting to load this page. Please contact an administrator to fix this.");
    };
    res.status(200);
    res.send(str);
  });
});

module.exports.get = function(req) {
  let theme = JSON.parse(fs.readFileSync("./settings.json")).theme;
  let tname = encodeURIComponent(getCookie(req, "theme"));
  let name = (
    tname ?
      fs.existsSync(`./themes/${tname}`) ?
        tname
      : theme
    : theme
  )
  return {
    settings: (
      fs.existsSync(`./themes/${name}/pages.json`) ?
        JSON.parse(fs.readFileSync(`./themes/${name}/pages.json`).toString())
      : themesettings
    ),
    name: name
  };
};

module.exports.islimited = async function() {
  return cache == true ? false : true;
}

module.exports.ratelimits = async function(length) {
  if (cache == true) return setTimeout(
    indexjs.ratelimits
    , 1
  );
  cache = true;
  setTimeout(
    async function() {
      cache = false;
    }, length * 1000
  )
}

// Get a cookie.
function getCookie(req, cname) {
  let cookies = req.headers.cookie;
  if (!cookies) return null;
  let name = cname + "=";
  let ca = cookies.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return decodeURIComponent(c.substring(name.length, c.length));
    }
  }
  return "";
}