export const getCSRFToken = () => {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      if (cookie[0] === "csrftoken") {
        return cookie[1];
      }
    }
    return "";
  };

export function getSessionId(): string{
    const sessionCookie = document.cookie
      .split(';')
      .find((cookie) => cookie.trim().startsWith('sessionid='));
  
    if (sessionCookie) {
      const sessionId = sessionCookie.split('=')[1];
      return sessionId;
    }
  
    return "";
  }