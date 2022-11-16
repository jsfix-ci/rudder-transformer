const DestHandlerMap = {
  ga360: "ga"
};

const DestCanonicalNames = {
  fb_pixel: [
    "fb_pixel",
    "fb pixel",
    "FacebookPixel",
    "Facebook Pixel",
    "FB Pixel"
  ],
  ometria: ["Ometria", "ometria", "OMETRIA"],
  sendgrid: ["sendgrid", "Sendgrid", "SENDGRID"],
  dcm_floodlight: [
    "dcm floodlight",
    "dcm_floodlight",
    "DCM Floodlight",
    "DCM_Floodlight",
    "DCMFloodlight",
    "dcmfloodlight"
  ],
  new_relic: [
    "new relic",
    "new_relic",
    "New Relic",
    "New_Relic",
    "NewRelic",
    "newrelic"
  ],
  attentive_tag: [
    "attentive tag",
    "attentive_tag",
    "Attentive Tag",
    "Attentive_Tag",
    "AttentiveTag",
    "attentivetag"
  ],
  webhook: ["webhook", "Webhook", "WebHook", "WEBHOOK"],
  mailchimp: ["mailchimp", "MailChimp", "MAILCHIMP"],
  mautic: ["MAUTIC", "mautic", "Mautic"],
  mailjet: ["MAILJET", "MailJet", "mailjet", "Mailjet"],
  kafka: ["KAFKA", "kafka", "Kafka"],
  azure_event_hub: ["AZURE_EVENT_HUB", "azure_event_hub", "AzureEventHub"],
  confluent_cloud: ["CONFLUENT_CLOUD", "confluent_cloud", "ConfluentCloud"],
  vero: ["vero", "Vero", "VERO"],
  pinterest: ["pinterest", "Pinterest", "PINTEREST", "pinterestConversion"],
  rockerbox: ["rockerbox", "ROCKERBOX", "Rockerbox", "RockerBox", "rockerBox"],
  canny: ["canny", "Canny", "CANNY"],
  one_signal: [
    "one signal",
    "one_signal",
    "One Signal",
    "One_Signal",
    "OneSignal",
    "onesignal"
  ],
  wootric: ["wootric", "Wootric", "WOOTRIC"],
  clickup: ["ClickUp", "clickup", "CLICKUP", "clickUp", "Clickup"],
  zapier: ["zapier", "Zapier", "ZAPIER"],
  shynet: ["shynet", "SHYNET", "shyNet", "ShyNet"],
  woopra: ["WOOPRA", "Woopra", "woopra"],
  monday: ["monday", "MONDAY", "monDay", "MonDay"],
  mailmodo: [
    "mail modo",
    "mail_modo",
    "Mail Modo",
    "Mail_Modo",
    "MailModo",
    "mailmodo",
    "MAILMODO",
    "mailModo"
  ],
  user: ["user", "USER", "User", "User.com", "user.com", "USER.com"],
  engage: ["engage", "Engage", "ENGAGE"],
  june: ["june", "JUNE", "June"],
  factorsai: ["FACTORSAI", "factorsAI", "FactorsAi", "factorsAi"],
  snapchat_custom_audience: [
    "snapchat custom audience",
    "snap chat custom audience",
    "snapchat_custom_audience",
    "snapchatCustomAudience",
    "Snapchat Custom Audience",
    "snapchatcustomaudience",
    "SNAPCHAT CUSTOM AUDIENCE",
    "SNAPCHAT_CUSTOM_AUDIENCE",
    "SNAPCHATCUSTOMAUDIENCE"
  ],
  CAMPAIGN_MANAGER: [
    "campaign manager",
    "campain Manager",
    "CAMPAIGN MANAGER",
    "campaignManager",
    "campaign_manager",
    "CAMPAIGN_MANAGER"
  ]
};

module.exports = { DestHandlerMap, DestCanonicalNames };
