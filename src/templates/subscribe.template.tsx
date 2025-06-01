import { FC } from 'hono/jsx';

interface SubscribeTemplateProps {
  city: string;
  confirmationLink: string;
}

const styles = {
  body: {
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    lineHeight: 1.6,
    color: '#1e293b',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f8fafc',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px 30px',
    border: '1px solid #e2e8f0',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
    borderTop: '5px solid #3a86ff',
  },
  header: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#3a86ff',
    textAlign: 'center',
    marginBottom: '20px',
    letterSpacing: '0.5px',
  },
  cityName: {
    color: '#3a86ff',
    fontWeight: 'bold',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '25px 0',
  },
  text: {
    fontSize: '16px',
    margin: '15px 0',
    color: '#334155',
    lineHeight: 1.7,
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '30px 0',
  },
  button: {
    backgroundColor: '#3a86ff',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 'bold',
    padding: '14px 28px',
    border: 'none',
    margin: '20px auto',
    display: 'inline-block',
    textDecoration: 'none',
    fontSize: '16px',
    boxShadow: '0 4px 6px rgba(58, 134, 255, 0.2)',
    letterSpacing: '0.5px',
  },
  footer: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    margin: '8px 0',
  },
  footerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: '0 0 12px 12px',
    padding: '15px',
    marginTop: '20px',
  },
};

export const SubscribeTemplate: FC<SubscribeTemplateProps> = ({
  city,
  confirmationLink,
}) => {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirm Your Weather Subscription</title>
        <meta name="description" content={`Confirm your weather subscription for ${city}`} />
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          <h1 style={styles.header}>Confirm Your Weather Subscription</h1>
          <hr style={styles.hr} />
          <div>
            <p style={styles.text}>
              Hello there! Thank you for subscribing to weather updates for <span style={styles.cityName}>{city}</span>.
            </p>
            <p style={styles.text}>
              We're excited to keep you informed about the weather conditions in your area. To start receiving regular updates, please confirm your subscription by clicking the button below:
            </p>
            <div style={styles.buttonContainer}>
              <a href={confirmationLink} style={styles.button}>
                Confirm Subscription
              </a>
            </div>
            <p style={styles.text}>
              If you didn't request this subscription, you can safely ignore this email and you won't receive any weather updates.
            </p>
          </div>
          <div style={styles.footerContainer}>
            <p style={styles.footer}>
              &copy; {new Date().getFullYear()} Weather Subscription Service
            </p>
            <p style={styles.footer}>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export const SubscribeTemplateText = ({ city, confirmationLink }: SubscribeTemplateProps) => {
  return `Hello, Thank you for subscribing to weather updates for ${city}.
To confirm your subscription and start receiving weather updates, please click the link below:
${confirmationLink}
If you didn't request this subscription, you can safely ignore this email.
&copy; ${new Date().getFullYear()} Weather Subscription Service
This is an automated message, please do not reply to this email.`;
};
