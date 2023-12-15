export class AuthenticationManager {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
   this.baseUrl = baseUrl;
  }
  
  public isLoggedIn(): Promise<boolean> {
   return new Promise((resolve, reject) => {
    // let token = localStorage.getItem("auth_token");
  
    this.validateToken().then((valid) => {
     if (valid) {
      console.log("token valid ");
      resolve(true);
     } else {
      console.log("token not valid ");
      localStorage.removeItem("auth_token");
      reject(false);
     }
    });
   });
  }
  
  private validateToken(): Promise<boolean> {
   return new Promise((resolve, reject) => {
    fetch(this.baseUrl + "/validateToken", {
     method: "POST",
     mode: "cors",
     headers: {
      "Content-Type": "application/json",
     },
     referrerPolicy: "no-referrer",
     // Do not need to explicitly send the token as it is stored in a cookie -- server can extract from it's access to the cookie
     // body: JSON.stringify({ token }),
    }).then((valid) => {
     if (valid) {
      resolve(true);
     } else {
      console.debug("clearing auth token because it failed validation");
      // localStorage.removeItem("auth_token");
      // logout instead ... or see if have a refresh token to utilize ...
      resolve(false);
     }
    });
   });
  }
  
  public login(username, password, rememberMe): Promise<any> {
   // add some logic to ensure you are on an https connection?  
   if (window.location.protocol !== "https:") {
    throw new Error("Authentication requires HTTPS connection");
   }

   return new Promise((resolve, reject) => {
    fetch(this.baseUrl + "/login", {
     method: "POST",
     mode: "cors",
     headers: {
      "Content-Type": "application/json",
     },
     referrerPolicy: "no-referrer",
     // send remember me flag to server, so server can set cookie expiry (or not, i.e., default to session).
     body: JSON.stringify({ username, password, rememberMe }),
    })
     .then(async (response) => {
      // this has been moved to the server ... and re-implemented as "stay logged in" (or not).  RememberMe feature would involve pre-filling the form with login id
      // if (rememberMe) {
      //  const token = await response.json();
      //  localStorage.setItem("auth_token", token);  
      // }

      // call getProfileForLoggedInUser() instead of this logic
      this.getProfileForLoggedInUser(token).then((profile, groups) => {
       resolve({ profile, groups });
      };
     //  fetch(this.baseUrl + "/profile/" + username, {
     //   method: "GET",
     //   mode: "cors",
     //   referrerPolicy: "no-referrer",
     //  }).then((response) => {
     //   let profile = response.json();
     //   fetch(this.baseUrl + "/roles/" + username, {
     //    method: "GET",
     //    mode: "cors",
     //    referrerPolicy: "no-referrer",
     //   })
     //    .then((response2) => {
     //     const groups = response.json();
     //     resolve({ profile, groups });
     //    })
     //    .catch((e) => {
     //     reject(e);
     //    });
     //  });
     // })
     // .catch((e) => {
     //  reject(e);
     // });
   });
  }
  
  public async getProfileForLoggedInUser(): Promise<any> {
   let token = localStorage.getItem("auth_token");

   // "extracts" the username from the token (server call ... no need to explicitly pass the token if moved to cookie)
   const response = await fetch(this.baseUrl + "/get?token=" + token, {
    method: "GET",
    mode: "cors",
    referrerPolicy: "no-referrer",
   });
  
   const { username } = await response.json();

   // Given this is for the logged in user (and not some admin-level function which would need to query for other users), I might not even pass the username
   // although likely you'd need the ability to retrieve other users for admin, so probably makes sense as it is, but either way
   // the server will need to ensure the requesting user (identified via token) has the permission to retrieve the targeted username, be it their own or some other user)
   return fetch(this.baseUrl + "/profile/" + username, {
    method: "GET",
    mode: "cors",
    referrerPolicy: "no-referrer",
   }).then((response) => {
    let profile = response.json();
    // same username consideration as above
    fetch(this.baseUrl + "/roles/" + username, {
     method: "GET",
     mode: "cors",
     referrerPolicy: "no-referrer",
    }).then((response2) => {
     const groups = response.json();
     return { profile, groups };
    });
    // bard mentioned to consider combining profile and roles to one call -- I probably would have made roles a part of the profile -- depends on the context/system/requirements
    // or I think this is sychronous calls -- these two coupld be done at same time if left separate.
   });
  }
  
  public async logout(): Promise<void> {
   // set cookie to empty string:
   document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`;
     
   // let token: string = localStorage.get("auth_token");

   // call logout for other session tracking, cleanup/invalidation, logging, etc.
   await fetch(this.baseUrl + "/logout", {
    method: "POST",
    mode: "cors",
    headers: {
     "Content-Type": "application/json",
    },
    referrerPolicy: "no-referrer",
    // body: JSON.stringify({ token: token }),
   });
  
   // localStorage.removeItem("auth_token");
  
   // await fetch(this.baseUrl + "/get?token=" + token, {
   //  method: "GET",
   //  mode: "cors",
   //  referrerPolicy: "no-referrer",
   // });
  }
 }

