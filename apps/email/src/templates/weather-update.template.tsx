import { FC } from "hono/jsx";

export type WeatherUpdateTemplateProps = {
  city: string;
  unsubscribeLink: string;
  temperature: number;
  humidity: number;
  description: string;
};

const styles = {
  body: {
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    lineHeight: 1.6,
    color: '#1e293b',
    margin: '0',
    padding: '0',
    width: '100%',
    backgroundColor: '#f8fafc',
  },
  main: {
    padding: '20px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    border: '1px solid #e2e8f0',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    borderTop: '5px solid #3a86ff',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3a86ff',
    textAlign: 'center',
    marginBottom: '15px',
    letterSpacing: '0.5px',
  },
  cityHeader: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: '20px',
    textAlign: 'center',
    letterSpacing: '0.3px',
  },
  weatherCard: {
    backgroundColor: 'rgba(58, 134, 255, 0.08)',
    borderRadius: '10px',
    padding: '25px',
    marginBottom: '25px',
    border: '1px solid rgba(58, 134, 255, 0.2)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
  },
  weatherInfo: {
    textAlign: 'center',
  },
  weatherItem: {
    fontSize: '16px',
    margin: '8px 0',
    textAlign: 'center',
    color: '#334155',
  },
  weatherValue: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#0f172a',
  },
  description: {
    fontSize: '20px',
    fontWeight: '500',
    textAlign: 'center',
    margin: '15px 0',
    color: '#0f172a',
    letterSpacing: '0.3px',
  },
  temperature: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0',
    color: '#3a86ff',
    letterSpacing: '0.5px',
  },
  footer: {
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#64748b',
  },
  unsubscribeLink: {
    color: '#3a86ff',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'opacity 0.2s ease',
  },
  note: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '15px',
    fontStyle: 'italic',
  },
};

export const WeatherUpdateTemplate: FC<WeatherUpdateTemplateProps> = ({
  city,
  unsubscribeLink,
  temperature,
  humidity,
  description,
}) => {
  const formatDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Weather Update for {city}</title>
      </head>
      <body style={styles.body}>
        <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tr>
            <td align="center" style={styles.main}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={styles.container}>
                <tr>
                  <td align="center">
                    <h1 style={styles.header}>Weather Update</h1>
                    <h2 style={styles.cityHeader}>{city}</h2>

                    <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                      <tr>
                        <td style={styles.weatherCard}>
                          <div style={styles.weatherInfo}>
                            <p style={styles.description}>{description}</p>
                            <p style={styles.temperature}>{temperature}°C</p>
                            <p style={styles.weatherItem}>
                              Humidity: <span style={styles.weatherValue}>{humidity}%</span>
                            </p>
                            <p style={styles.weatherItem}>
                              Updated: <span style={styles.weatherValue}>{formatDate()}</span>
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                      <tr>
                        <td style={styles.footer}>
                          <p>
                            You're receiving this update because you subscribed to weather updates.
                          </p>
                          <p>
                            <a href={unsubscribeLink} style={styles.unsubscribeLink}>
                              Unsubscribe from weather updates
                            </a>
                          </p>
                          <p style={styles.note}>
                            This is an automated message. Please do not reply to this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export const WeatherUpdateTemplateText = ({
  city,
  unsubscribeLink,
  temperature,
  humidity,
  description,
}: WeatherUpdateTemplateProps) => {
  return `Weather Update
${city}

Current Weather Conditions:
Temperature: ${temperature}°C
Humidity: ${humidity}%
Description: ${description}
Updated: ${new Date().toLocaleString()}

You're receiving this update because you subscribed to weather updates.
To unsubscribe, visit: ${unsubscribeLink}`;
};
