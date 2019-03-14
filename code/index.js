/* eslint-disable  func-names */
/* eslint-disable  no-console */

/**
 * package.json needed dependencies
 * 
 *  "ask-sdk-s3-persistence-adapter": "^2.0.0",
 *  "ask-sdk-core": "^2.0.7",
 *  "ask-sdk-model": "^1.4.1",
 *  "aws-sdk": "^2.326.0"
 * 
 */

/**
 * We need to import the ASK SDK module
 */
const Alexa = require('ask-sdk-core');

/**
 * We need to import the S3 Persistence Adapter module
 */
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

/**
 * Handler to handle LaunchRequestHandler requests sent by Alexa 
 * Note : this type of request is send when the user invokes your skill without providing a specific intent.
 * For example : 'Alexa, ouvre anecdotes de france'
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    // speech (prompt) start
    let speechText = "Bienvenue sur la Skill des anecdotes sur les villes françaises."
    // reprompt
    const repromptText = 'Pour quelle ville souhaitez-vous connaître une anecdote ?';
    // get session attributes
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    // append to speech text the number of times, the skill has been launched
    if (sessionAttributes['counter']) {
      speechText += " Vous m'avez invoqué " + sessionAttributes['counter'] + " fois déjà!";
    }
    // speech (prompt) end
    speechText += " Dites-moi le nom d'une ville et vous apprendrez un fait nouveau sur celle-ci.";
    // append reprompt (question) to speech (prompt) text
    speechText += " " + repromptText;
    // use responseBuilder to generate the JSON response
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

/**
 * Handler to handle GetNewFactIntent requests sent by Alexa 
 * Note : this request is sent when the user makes a request that corresponds to GetNewFactIntent intent defined in your intent schema.
 */
const GetNewFactIntentHanlder = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetNewFactIntent';
  },
  handle(handlerInput) {
    // get response builder
    var builder = handlerInput.responseBuilder;
    // get request payload
    const request = handlerInput.requestEnvelope.request;
    // Get slot values (heard and main value)
    let slotValues = getSlotValues(request.intent.slots);
    // build speech from facts
    let speechText = '';
    var city = slotValues.citySlot.resolved;
    // if city mentionned has no fact, revert to 'france' facts
    if (city === undefined
      || typeof facts[city.toLowerCase()] === 'undefined') {
      city = "france";
      speechText += "Je n'ai pas trouvé d'anecdotes sur " + slotValues.citySlot.synonym + ". Je vous propose une anecdote sur la France : ";
    }
    // find fact
    let factIndex = Math.floor(Math.random() * facts[city].length);
    speechText += " " + facts[city][factIndex];
    // if not one-shot, ask for another city
    // we know it is a one-shot request if the session is a new session
    // Note : a one-shot utterance looks like :
    // "Alexa, demande à anecdotes de france un fait sur Toulouse"
    if (!handlerInput.requestEnvelope.session['new']) {
      const repromptText = 'Pour quelle autre ville souhaitez-vous connaître une anecdote ?';
      speechText += " " + repromptText;
      builder.reprompt(repromptText);
    }
    builder.speak(speechText);
    // use responseBuilder to generate the JSON response
    return builder.getResponse();
  },
};

/**
 * Handler to handle AMAZON.RepeatIntent requests sent by Alexa 
 * Note : this request is sent when the user makes a request that corresponds to AMAZON.RepeatIntent intent defined in your intent schema.
 */
const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    // get session attributes
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    // set fallback prompt & reprompt
    let repromptText = 'Pour quelle ville souhaitez-vous connaître une anecdote ?';
    let speechText = "Désolé, je n'ai pas compris. " + repromptText;
    // use last prompt from session attributes if it exists
    if (sessionAttributes.lastPrompt !== undefined){
        speechText = sessionAttributes.lastPrompt;
    }
    // use last reprompt from session attributes if it exists
    if (sessionAttributes.lastReprompt !== undefined){
        repromptText = sessionAttributes.lastReprompt;
    }
    // use responseBuilder to generate the JSON response
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

/**
 * Handler to handle AMAZON.HelpIntent requests sent by Alexa 
 * Note : this request is sent when the user makes a request that corresponds to AMAZON.HelpIntent intent defined in your intent schema.
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    // set help prompt & reprompt messages
    const speechText = 'Je vous donne des faits sur les différentes métropoles de France. Il suffit par exemple de me dire "Alexa, donne-moi une anecdote sur Rennes".';
    const repromptText = 'Pour quelle ville souhaitez-vous connaître une anecdote ?';
    // use responseBuilder to generate the JSON response
    return handlerInput.responseBuilder
      .speak(speechText + repromptText)
      .reprompt(repromptText)
      .getResponse();
  },
};

/**
 * Handler to handle AMAZON.CancelIntent & AMAZON.StopIntent requests sent by Alexa 
 * Note : this request is sent when the user makes a request that corresponds to AMAZON.CancelIntent & AMAZON.StopIntent intents defined in your intent schema.
 */
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    // set cancel and stop prompt
    // Note : we want to close the Skill's session hence we don't provide a reprompt
    // If no reprompt is set, then the JSON response do not contain the shouldEndSession parameter 
    // which is equivalent to closing the session
    const speechText = 'Au revoir !';
    // use responseBuilder to generate the JSON response
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

/**
 * Handler to handle SessionEndedRequest request sent by Alexa
 * Note : this type of request is send when the current skill session ends for any reason other than your code closing the session.
 */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // log the reason why the session was ended
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    // use responseBuilder to generate the JSON response (empty response)
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * Handler to catch exceptions from other Handler
 */
const GlobalErrorHandler = {
  canHandle(handlerInput, error) {
    // Note : an error has at least .message & .type properties which you can use filter exceptions
    return true;
  },
  handle(handlerInput, error) {
    // log the error
    console.log("==== ERROR ======");
    console.log(`${error}`);
    // provide a prompt to let the user know we could not understand him
    const speechText = "Désolé, je n'ai pas compris. Pouvez-vous répéter?";
    // use responseBuilder to generate the JSON response
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

/**
 * Request Interceptor to log the request sent by Alexa
 */
const LogRequestInterceptor = {
  process(handlerInput) {
    // Log Request
    console.log("==== REQUEST ======");
    console.log(JSON.stringify(handlerInput.requestEnvelope, null, 2));
  }
}
/**
 * Response Interceptor to log the response made to Alexa
 */
const LogResponseInterceptor = {
  process(handlerInput, responseOutput) {
    // Log Response
    console.log("==== RESPONSE ======");
    console.log(JSON.stringify(responseOutput, null, 2));
  }
}

/**
 * Response Interceptor to put prompt & reprompt texts into the session attributes
 * Objective : being able to repeat latest spoken elements from the Skill in case a user asks a repeat
 */
const ResponseRepeatInterceptor = {
  process(handlerInput, response) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (response) {
      // Save the response and reprompt for repeat
      // Be sure to strip <speak> tags
      if (response.outputSpeech && response.outputSpeech.ssml) {
        let lastPrompt = response.outputSpeech.ssml;
        lastPrompt = lastPrompt.replace('<speak>', '');
        lastPrompt = lastPrompt.replace('</speak>', '');
        sessionAttributes.lastPrompt = lastPrompt;
      }
      if (response.reprompt && response.reprompt.outputSpeech
        && response.reprompt.outputSpeech.ssml) {
        let lastReprompt = response.reprompt.outputSpeech.ssml;
        lastReprompt = lastReprompt.replace('<speak>', '');
        lastReprompt = lastReprompt.replace('</speak>', '');
        sessionAttributes.lastReprompt = lastReprompt;
      }
    }
    return Promise.resolve();
  },
};

/**
 * Request Interceptor to get data from persistent layer only on new session opening
 * and put the data into session attributes
 */
const RequestPersistenceInterceptor = {
  process(handlerInput) {
    // only load persistent data on new session
    if (handlerInput.requestEnvelope.session['new']) {
      return new Promise((resolve, reject) => {
        handlerInput.attributesManager.getPersistentAttributes()
          .then((s3Attributes) => {
            s3Attributes = s3Attributes || {};
            const counter = s3Attributes.hasOwnProperty('counter') ? s3Attributes.counter : 0;
            s3Attributes.counter = counter + 1;
            handlerInput.attributesManager.setSessionAttributes(s3Attributes);
          }).then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  }
};

/**
 * Response Interceptor to persist session attributes
 * only when session is closed
 * shouldEndSession parameter from response determine whether the session is opened or not
 * if defined and equals to true => session remains open
 * if undefined or equals to false => session is closed
 */
const ResponsePersistenceInterceptor = {
  process(handlerInput, response) {
    // only save persistent attributes on session closing
    if (response &&
      (response.shouldEndSession === undefined
        || response.shouldEndSession === true)) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      // we don't want to persist information only needed during the session
      // clear last prompt & reprompt
      sessionAttributes.lastPrompt = undefined;
      sessionAttributes.lastReprompt = undefined;
      // position session attributes as persistent attributes
      handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);
      // persistent data
      handlerInput.attributesManager.savePersistentAttributes()
    }
    return Promise.resolve();
  }
};

/**
 * We define the ASK SDK SkillBuilder to be used
 */
const skillBuilder = Alexa.SkillBuilders.custom().withPersistenceAdapter(
    /* Define persistence layer to be S3 : define the S3 adapter with the S3 Bucket */
  new persistenceAdapter.S3PersistenceAdapter({ bucketName: process.env.S3_PERSISTENCE_BUCKET }));

/**
 * We add the needed behavior to the newly created SkillBuilder
 * .addRequestHandlers(...) 
 * => Request handlers are responsible for handling one or more types of incoming requests
 * => We need to register the handlers defined above to be used 
 * .addErrorHandlers(...)
 * => Error handlers are similar to request handlers, but are instead responsible for handling one or more types of errors.
 * => We need to register the error handlers defined above to be used
 * .addRequestInterceptors(...)
 * .addResponseInterceptors(...)
 * => The SDK supports request and response interceptors that execute before and after RequestHandler execution, respectively. 
 * => We need to register the interceptors defined above to be used
 */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetNewFactIntentHanlder,
    RepeatIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(GlobalErrorHandler)
  .addRequestInterceptors(LogRequestInterceptor, RequestPersistenceInterceptor)
  .addResponseInterceptors(LogResponseInterceptor, ResponseRepeatInterceptor, ResponsePersistenceInterceptor)
  .lambda();

/**
 * Function to extract slot values from request json
 * and gather an array where each item has the following properties
 * .synonym     =>  the value heared by Alexa
 * .resolved    =>  the main value resolved by Alexa on the given Slot Type
 * .isValidated =>  boolean to indicated whether the heared value is the main value
 * .ERstatus    =>  status on whether Entity Resolution (ER) found a match
 */
function getSlotValues(filledSlots) {
  const slotValues = {};

  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;
    slotValues[name] = {};

    // Extract the nested key 'code' from the ER resolutions in the request
    let erStatusCode;
    try {
      erStatusCode = ((((filledSlots[item] || {}).resolutions ||
        {}).resolutionsPerAuthority[0] || {}).status || {}).code;
    } catch (e) {
      console.log('erStatusCode e:' + e)
    }

    switch (erStatusCode) {
      case 'ER_SUCCESS_MATCH':
        slotValues[name].synonym = filledSlots[item].value;
        slotValues[name].resolved = filledSlots[item].resolutions
          .resolutionsPerAuthority[0].values[0].value.name;
        slotValues[name].isValidated = filledSlots[item].value ===
          filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name;
        slotValues[name].ERstatus = erStatusCode;
        break;

      default: // ER_SUCCESS_NO_MATCH, undefined
        slotValues[name].synonym = filledSlots[item].value;
        slotValues[name].resolved = filledSlots[item].value;
        slotValues[name].isValidated = false;
        slotValues[name].ERstatus = erStatusCode === undefined ? 'undefined' : erStatusCode;
        break;
    }
  }, this);

  return slotValues;
}

/**
 * List of facts per city
 */
const facts = {
  "france":
    [
      "Le Canal du Midi est le plus vieux canal encore fonctionnel en Europe. Il fut construit entre 1666 et 1681. Il mesure 240 km de long.",
      "Les gorges du Verdon sont le plus grand canyon d’Europe mesurant environ 25 kilomètres de long et jusqu'à 700 mètres de profondeur.",
      "Presque 20 % du territoire français se situe en dehors de l'Europe.",
      "Jusqu'en 1964 les femmes françaises ne pouvaient pas ouvrir un compte bancaire ou obtenir un passeport sans l'autorisation de leur mari.",
      "La nicotine a été nommée d'après Jean Nicot (1530-1600), un diplomate français et érudit qui a introduit la plante de tabac en France en 1559 (du Portugal).",
      "La Marseillaise a été composée à Strasbourg en 1792.",
      "Le célèbre petit-suisse de Gervais n'est pas originaire de Suisse, mais de Normandie."
    ],
  "paris":
    [
      "Dans le monde, 38 villes se nomment Paris !",
      "La place de la Concorde est un cadran solaire géant. L’ombre de l’obélisque sert d’aiguille et des chiffres romains sont inscrits sur les dalles tout autour.",
      "Il existe une dizaine de stations de métro fantômes dans Paris. Fermées au public, certaines servent aujourd’hui de garage pour les trains.",
      "L’un des cafés les plus vieux de Paris est Le Proscope qui existe depuis 1686 !",
      "Paris a été fondée par les Parisii, une tribu celte, vers 250 avant notre ère. Les Romains la renommèrent Luteca en 52 avant notre ère, et elle devint seulement connue sous le nom de Paris après la chute de l'Empire romain d'Occident au Ve siècle.",
      "Le Louvre est le plus grand château-palais du monde. Il couvre une superficie de 210000 m², dont le Musée du Louvre occupe 60.600 m². En comparaison, le château de Versailles mesure 67000 m², Buckingham Palace 77000 m² et le Palais apostolique du Vatican 162000 m²."
    ],
  "bordeaux": [
    "Autrefois, la porte St Eloi (plus vieille porte de Bordeaux) était une prison. La cloche aurait par la suite été coulée grâce à la prise de canons espagnols…",
    "La ville de Bordeaux était, et est toujours, le lieu de passage des pèlerins. Autrefois hébergés à l’Hôpital Sait-James situé dans la fameuse rue du Mirail déjà évoquée, ils sont de nos jours accueillis à la Maison des Pèlerins, de Mars à Octobre.",
    "Principale rue commerciale de Bordeaux, la rue Sainte-Catherine est la plus longue rue piétonne d’Europe.",
    "Pendant la première guerre mondiale, Bordeaux devient le 3 septembre 1914, la capitale de la France. Le président Raymond Poincaré s'y installe pendant un mois, jusqu'à la victoire alliée de la première bataille de la Marne."
  ],
  "toulouse": [
    "En hommage aux comtes de Toulouse, la ville de Toulouse s’est fait appeler la Ciutat Mondina (autrement dit la « Cité Mondine »). Au XIXe siècle, la gracieuse violette, devenue l’emblème de Toulouse, lui légua le délicat surnom de « Cité des Violettes ». Aujourd’hui, Toulouse porte le surnom de « Ville Rose ».",
    "Située sous le palais de Justice de Toulouse, la crypte archéologique permet de découvrir les vestiges de l’histoire toulousaine, celles des Romains et des comtes de Toulouse…",
    "Toulouse est surnommée la « ville rose » en raison de la couleur du matériau de construction traditionnel local: la brique de terre cuite.",
    "Le sport emblématique de Toulouse est le rugby à XV, son club du Stade toulousain détenant le plus riche palmarès sur le plan national comme sur le plan continental, avec 19 titres de champion de France et 4 titres de champion d'Europe."
  ],
  "rennes":
    [
      "Rennes se trouve à 55 kilomètres de la manche",
      "Rennes est la première ville de la région bretonne avec 216 268 habitants intra-muros.",
      "A l’époque Gallo-Romaine, Rennes portait le nom gaulois de Condate, désignant une confluence.",
      "Victime d’un terrible incendie en 1720, le centre médiéval en bois de Rennes est partiellement reconstruit en pierre avec du granit et du tuffeau.",
      "Labellisée ville d’art et d’histoire, Rennes a conservé un important patrimoine médiéval et classique au sein de son centre historique. 90 édifices sont aujourd’hui protégés au titre des monuments historiques."
    ],
  "lille":
    [
      "Lille, autrement appelée la “Capitale des Flandres” est la préfecture du département du Nord et le chef-lieu de la région Hauts de France.",
      "Le Général Charles de Gaulle est né à Lille le 22 novembre 1890.",
      "La ville de Lille doit son nom à sa localisation primitive sur une île des marécages de la vallée de la Deûle où elle a été fondée.",
      "Le premier Carambar a été crée en 1954 à Marcq-en-Barœul dans l’usine du Chocolat Delespaul-Havez à moins de 15 kilometres de Lille.",
      "Le métro Lillois est le premier métro automatique au monde : Il a été inauguré par le président François Mitterand et son premier ministre Pierre Mauroy en 1983."
    ],
  "roubaix":
    [
      "La course cycliste Paris-Roubaix a été créée en 1896 par Théodore Vienne après l'ouverture du nouveau vélodrome de Roubaix. Elle est surnommée “l’enfer du Nord”.",
      "Roubaix fut l’une des capitales mondiales de l’industrie textile au début du XXéme siècle.",
      "Le musée d’art et d’industrie de la ville de Roubaix se situe dans une ancienne piscine de style art déco, construite entre 1927 et 1932 par l'architecte lillois Albert Baert, d'où son surnom « La Piscine ».",
      "Depuis 2001, la ville de Roubaix est classée ville d’art et d’histoire."
    ],
  "lens":
    [
      "La ville de Lens ainsi que tout l’Artois fut rattaché au Pays-Bas espagnol de 1526 à 1659.",
      "Les joueurs du Racing Club de Lens sont surnommée les Sang et Or. (en référence au drapeau espagnol).",
      "L’équipe de football de la ville, le Racing Club de Lens  le surnom de Sang et Or.",
      "Lens est la plus petite ville à avoir accueilli une coupe du monde de football (en 1998) et une coupe du monde de rugby (en 1999 puis en 2007).",
      "Lens accueille une antenne du musée du Louvre depuis 2012 sur un parc de vingt hectares."
    ],
    "nancy":
    [
      "L’éclairage à l’huile a été introduit à Nancy en 1772.",
      "La place royale de Stanislas, autrement appelée place Stan a plus de 260 ans. Elle est classée au patrimoine mondial de l’UNESCO depuis 1983.",
      "Michel Platini a joué à l’AS Nancy de 1972 à 1979.",
      "Le tramway de Nancy est sur pneu à guidage central et couvre une distance de 10 kilomètres."
    ]
};