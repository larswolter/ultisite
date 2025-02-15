import '../schema.js';
import './hat.js';
import './mails.js';
import './teamDrawing.js';

let isAdmin, settings, Mail, renderMailTemplate;

const configureHat = (config) => {
  isAdmin = config.isAdmin;
  settings = config.settings;
  Mail = config.Mail;
  renderMailTemplate = config.renderMailTemplate;
};

export { configureHat, isAdmin, settings, Mail, renderMailTemplate };
