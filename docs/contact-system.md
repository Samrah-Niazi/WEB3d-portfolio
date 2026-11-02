# Contact system

`POST /api/contact` (`backend/src/contact.ts`) and the form in `frontend/src/components/ContactForm.tsx`.

## Fields and validation
| Field | Rule |
|---|---|
| name | 2 to 80 characters, no line breaks |
| email | valid address, up to 254 characters |
| subject | 3 to 120 characters, no line breaks |
| message | 10 to 2000 characters |

The browser checks these rules first and shows inline errors. The server checks them again with Zod and returns `400` with a message per field.

## Spam protection and input handling
- **Honeypot:** a hidden "website" field. Bots fill it in; people never see it. The server answers "success" but sends nothing.
- **Minimum fill time:** forms submitted less than 3 seconds after the page loaded are dropped the same way.
- **Rate limit:** 5 messages per hour per IP address (`429` after that), plus 60 API requests per minute overall.
- **Header injection:** name and subject may not contain line breaks, so visitors can't add email headers such as `Bcc`.
- **Plain-text email:** the message is never sent as HTML, so scripts or markup in it are never interpreted. Control characters are stripped.
- **Limits:** request bodies are capped at 20 KB; `helmet` sets security headers; CORS only allows `CLIENT_ORIGIN`.

## Credentials
`SMTP_USER`, `SMTP_PASS` and `CONTACT_TO` are read from environment variables (`backend/.env` locally, the host's settings in production). `.env` is git-ignored. With no credentials the endpoint returns `503` and the form shows an error.

## Evidence of delivery
Each send is logged to the server console and appended to `backend/logs/contact.log` with the SMTP message id and accepted recipient. For the report, include a screenshot of the success message, the received email in the inbox (check that Reply-To is the visitor), and this log.
