import os
import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_email():
    print("=== SMTP Email Diagnostics ===")
    
    # 1. Check Secrets
    user = os.environ.get("EMAIL_USERNAME")
    password = os.environ.get("EMAIL_PASSWORD")
    server_addr = os.environ.get("EMAIL_SMTP_SERVER", "smtp.gmail.com")
    port_str = os.environ.get("EMAIL_SMTP_PORT", "587")
    
    print(f"SMTP Server: {server_addr}")
    print(f"SMTP Port: {port_str}")
    
    errors = False
    if not user:
        print("❌ Error: EMAIL_USERNAME environment variable is EMPTY!")
        errors = True
    else:
        print(f"✔ EMAIL_USERNAME is set to: {user}")
        
    if not password:
        print("❌ Error: EMAIL_PASSWORD environment variable is EMPTY!")
        errors = True
    else:
        print("✔ EMAIL_PASSWORD is set (hidden).")
        
    if errors:
        print("\n❌ Diagnostics failed: Missing SMTP configuration secrets.")
        sys.exit(1)
        
    try:
        port = int(port_str)
    except ValueError:
        print(f"❌ Error: EMAIL_SMTP_PORT must be an integer, got: '{port_str}'")
        sys.exit(1)
        
    # 2. Test Connection
    print("\nAttempting connection to SMTP server...")
    try:
        if port == 465:
            print("Detected port 465, using SSL connection...")
            server = smtplib.SMTP_SSL(server_addr, port, timeout=15)
        else:
            print(f"Using standard connection on port {port}...")
            server = smtplib.SMTP(server_addr, port, timeout=15)
            print("Sending EHLO...")
            server.ehlo()
            print("Starting TLS session...")
            server.starttls()
            server.ehlo()
        print("✔ Connected to SMTP server successfully.")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("\nPossible solutions:")
        print("1. If using port 465, ensure your mail server supports SSL.")
        print("2. If using port 587, ensure your mail server supports STARTTLS.")
        print("3. Check if the server address is correct and accessible from GitHub Actions runners.")
        sys.exit(1)
        
    # 3. Test Authentication
    print("\nAttempting authentication...")
    try:
        server.login(user, password)
        print("✔ SMTP login successful!")
    except Exception as e:
        print(f"❌ Authentication Error: {e}")
        print("\nPossible solutions:")
        print("1. Double-check your username and password.")
        print("2. If using Gmail, make sure you are using an 'App Password' rather than your main account password.")
        print("3. Ensure 'Less secure app access' is enabled if your provider requires it.")
        sys.exit(1)
        
    # 4. Attempt to send a test email to yourself
    print(f"\nAttempting to send test email to {user}...")
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Classroom 50 - Autograding SMTP Test"
        msg["From"] = user
        msg["To"] = user
        
        html = """
        <html>
        <body>
            <h3>✔ Classroom 50 SMTP Test Successful</h3>
            <p>If you are reading this email, your GitHub Actions email notification system is fully operational!</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))
        server.sendmail(user, user, msg.as_string())
        server.quit()
        print("✔ Test email sent successfully!")
        print("=== Diagnostics Passed! ===")
    except Exception as e:
        print(f"❌ Failed to send mail: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_email()
