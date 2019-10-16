import smtplib as smtp
import ujson as js

def send_email(msg_type:str, msg_params:dict, email_login_path:str):
    with open(email_login_path) as file:
        params = js.load(file)

    server = smtp.SMTP_SSL(**params['smtp'])
    server.login(**params['login'])
    server.sendmail(
        params['emails'][msg_type]['from'],
        params['emails'][msg_type]['to'],
        params['template'].format(**params['emails'][msg_type]).format(**msg_params)
    )
    server.quit()