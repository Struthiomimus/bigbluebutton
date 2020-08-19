import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';
import Settings from '/imports/ui/services/settings';
import LoadingScreen from '/imports/ui/components/loading-screen/component';

const propTypes = {
  locale: PropTypes.string,
  children: PropTypes.element.isRequired,
};

const DEFAULT_LANGUAGE = Meteor.settings.public.app.defaultSettings.application.locale;

const RTL_LANGUAGES = ['ar', 'he', 'fa'];

const defaultProps = {
  locale: DEFAULT_LANGUAGE,
};

class IntlStartup extends Component {
  static saveLocale(localeName) {
    Settings.application.locale = localeName;
    if (RTL_LANGUAGES.includes(localeName.substring(0, 2))) {
      document.body.parentNode.setAttribute('dir', 'rtl');
      Settings.application.isRTL = true;
    } else {
      document.body.parentNode.setAttribute('dir', 'ltr');
      Settings.application.isRTL = false;
    }
    Settings.save();
  }

  constructor(props) {
    super(props);

    this.state = {
      messages: {},
      normalizedLocale: null,
      fetching: true,
    };

    if (RTL_LANGUAGES.includes(props.locale)) {
      document.body.parentNode.setAttribute('dir', 'rtl');
    }

    this.fetchLocalizedMessages = this.fetchLocalizedMessages.bind(this);
  }

  componentDidMount() {
    const { locale } = this.props;
    this.fetchLocalizedMessages(locale, true);
  }

  componentDidUpdate() {
    const { fetching, normalizedLocale } = this.state;
    const { locale } = this.props;

    if (!fetching
      && normalizedLocale
      && locale.toLowerCase() !== normalizedLocale.toLowerCase()) {
      this.fetchLocalizedMessages(locale);
    }
  }

  fetchLocalizedMessages(locale, init = false) {
    const url = `/html5client/locale?locale=${locale}&init=${init}`;

    this.setState({ fetching: true }, () => {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            return Promise.reject();
          }

          return response.json();
        })
        .then(({ messages, normalizedLocale }) => {
          const dasherizedLocale = normalizedLocale.replace('_', '-');
          this.setState({ messages, fetching: false, normalizedLocale: dasherizedLocale }, () => {
            IntlStartup.saveLocale(dasherizedLocale);
          });
        })
        .catch(() => {
          this.setState({ fetching: false, normalizedLocale: null }, () => {
            IntlStartup.saveLocale(DEFAULT_LANGUAGE);
          });
        });
    });
  }


  render() {
    const { fetching, normalizedLocale, messages } = this.state;
    const { children } = this.props;

    return (fetching || !normalizedLocale) ? <LoadingScreen /> : (
      <IntlProvider locale={normalizedLocale} messages={messages}>
        {children}
      </IntlProvider>
    );
  }
}

const IntlStartupContainer = withTracker(() => {
  const { locale } = Settings.application;

  return {
    locale,
  };
})(IntlStartup);

export default IntlStartupContainer;

IntlStartup.propTypes = propTypes;
IntlStartup.defaultProps = defaultProps;
