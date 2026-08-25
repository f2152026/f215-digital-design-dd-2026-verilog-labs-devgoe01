import os
import json
import smtplib
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def is_ignored_email(email, smtp_user):
    email_lower = email.lower()
    smtp_user_lower = smtp_user.lower() if smtp_user else ""
    
    # Ignore if it matches the teacher's SMTP username/email
    if smtp_user_lower and smtp_user_lower in email_lower:
        return True
        
    # Ignore common GitHub Actions/Bot emails
    ignored_keywords = [
        "github-actions",
        "action@github",
        "noreply@github",
        "bot@classroom50",
        "support@github"
    ]
    for keyword in ignored_keywords:
        if keyword in email_lower:
            return True
            
    return False

def get_recipient_email(smtp_user):
    # 1. Try to get pusher/commit emails from GitHub event payload
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if event_path and os.path.exists(event_path):
        try:
            with open(event_path, "r") as f:
                event = json.load(f)
            
            # Try to get pusher email (who pushed the code)
            pusher_email = event.get("pusher", {}).get("email")
            if pusher_email and "@" in pusher_email and not is_ignored_email(pusher_email, smtp_user):
                print(f"Found pusher email in GitHub event: {pusher_email}")
                return pusher_email
                
            # Try to get head commit author email
            author_email = event.get("head_commit", {}).get("author", {}).get("email")
            if author_email and "@" in author_email and not is_ignored_email(author_email, smtp_user):
                print(f"Found head commit author email in GitHub event: {author_email}")
                return author_email
        except Exception as e:
            print(f"Error parsing GitHub event payload: {e}")

    # 2. Scan the last 10 commits in Git history to find a student email
    try:
        commits_output = subprocess.check_output(
            ["git", "log", "-10", "--format=%ae"]
        ).decode("utf-8").strip()
        
        emails = [email.strip() for email in commits_output.split("\n") if email.strip()]
        for email in emails:
            if "@" in email and not is_ignored_email(email, smtp_user):
                print(f"Found student email in git history: {email}")
                return email
    except Exception as e:
        print(f"Error scanning git history: {e}")

    # 3. Ultimate Fallback: return the latest commit author (even if it is the teacher or bot)
    try:
        email = subprocess.check_output(["git", "log", "-1", "--format=%ae"]).decode("utf-8").strip()
        print(f"Falling back to latest commit author email: {email}")
        return email
    except Exception:
        return None

def main():
    # 1. Check for SMTP credentials
    smtp_user = os.environ.get("EMAIL_USERNAME")
    smtp_pass = os.environ.get("EMAIL_PASSWORD")
    smtp_server = os.environ.get("EMAIL_SMTP_SERVER", "smtp.gmail.com")
    smtp_port = os.environ.get("EMAIL_SMTP_PORT", "587")

    if not smtp_user or not smtp_pass:
        print("SMTP credentials (EMAIL_USERNAME/EMAIL_PASSWORD) not found. Skipping email notification.")
        return

    # 2. Check for result.json
    result_path = "result.json"
    if not os.path.exists(result_path):
        print(f"Error: {result_path} not found. Cannot send email.")
        return

    try:
        with open(result_path, "r") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading result.json: {e}")
        return

    # 3. Determine recipient email
    recipient = get_recipient_email(smtp_user)
    print(f"Evaluated recipient email: {recipient}")
    if not recipient or "@" not in recipient:
        print(f"Error: Invalid or missing recipient email: {recipient}")
        return



    # 4. Parse result data
    classroom = data.get("classroom", "Digital Design Labs")
    assignment = data.get("assignment", "Lab Assignment")
    owner = data.get("owner", "Student")
    score = data.get("score", 0)
    max_score = data.get("max-score", 0)
    tests = data.get("tests", [])

    # 5. Build HTML content
    subject = f"[{classroom}] Autograding Result: {assignment} - {score}/{max_score}"
    
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 20px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }}
            h2 {{ color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; margin-top: 0; }}
            .summary {{ font-size: 16px; margin: 15px 0; }}
            .score {{ font-size: 24px; font-weight: bold; color: #27ae60; margin: 10px 0; }}
            .score.fail {{ color: #c0392b; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }}
            th {{ background-color: #f8f9fa; color: #7f8c8d; }}
            .badge {{ padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
            .badge.pass {{ background-color: #d4edda; color: #155724; }}
            .badge.fail {{ background-color: #f8d7da; color: #721c24; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #bdc3c7; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>📚 {classroom} - {assignment}</h2>
            <div class="summary">
                <p>Hello <strong>{owner}</strong>,</p>
                <p>Your submission has been evaluated by the autograder.</p>
                <div class="score {'fail' if score < max_score else ''}">
                    Score: {score} / {max_score}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Test Case</th>
                        <th>Status</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
    """

    for test in tests:
        name = test.get("name", "Test")
        status = test.get("status", "fail")
        t_score = test.get("score", 0)
        t_max = test.get("max-score", 0)
        status_class = "pass" if status == "pass" else "fail"
        status_text = "PASS" if status == "pass" else "FAIL"

        html += f"""
                    <tr>
                        <td>{name}</td>
                        <td><span class="badge {status_class}">{status_text}</span></td>
                        <td>{t_score} / {t_max}</td>
                    </tr>
        """

    html += f"""
                </tbody>
            </table>
            
            <p class="footer">
                This is an automated notification from the CS-215 Grading System. Please do not reply directly.
            </p>
        </div>
    </body>
    </html>
    """

    # 6. Send via SMTP
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = recipient
    msg.attach(MIMEText(html, "html"))

    try:
        port = int(smtp_port)
        if port == 465:
            print("Connecting to SMTP server via SSL (port 465)...")
            server = smtplib.SMTP_SSL(smtp_server, port)
        else:
            print(f"Connecting to SMTP server via TLS (port {port})...")
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.quit()
        print(f"Successfully sent autograding result email to {recipient}")
    except Exception as e:
        print(f"Error sending email via SMTP: {e}")


if __name__ == "__main__":
    main()
