export class AuthenticationManager {
    private baseUrl: string;
  
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }
  
    public isLoggedIn(): Promise<boolean> {
      return new Promise((resolve, reject) => {
        let token = localStorage.getItem("auth_token");
  
        this.validateToken(token).then((valid) => {
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
  
    private validateToken(token): Promise<boolean> {
      return new Promise((resolve, reject) => {
        // Need error handling here -- log the errors -- much easier to debug.
        // use something like:
        // const response = await fetch(this.baseUrl + "/validateToken", {
        //     method: "POST",
        //     mode: "cors",
        //         headers: {
        //           "Content-Type": "application/json",
        //         },
        //     referrerPolicy: "no-referrer",
        //     body: JSON.stringify({ token }),
        // });
       
        // if (!response.ok) {
        //  throw new HttpError(response.status, "HTTP error");
        // }
        // ....
          
        fetch(this.baseUrl + "/validateToken", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          referrerPolicy: "no-referrer",
          body: JSON.stringify({ token }),
        }).then((valid) => {
          if (valid) {
            resolve(true);
          } else {
            console.debug("clearing auth token because it failed validation");
            localStorage.removeItem("auth_token");
            resolve(false);
          }
        });
      });
    }
  
    public login(username, password, rememberMe): Promise<any> {
      // ensure HTTPS before proceeding.
      return new Promise((resolve, reject) => {
        fetch(this.baseUrl + "/login", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          referrerPolicy: "no-referrer",
          body: JSON.stringify({ username, password }),
        })
          .then(async (response) => {
            if (rememberMe) {
              const token = await response.json();
              localStorage.setItem("auth_token", token);  
            }
            // This logic is already implemented in the getProfile function .. just call it here rather than duplicate the logic.
            fetch(this.baseUrl + "/profile/" + username, {
              method: "GET",
              mode: "cors",
              referrerPolicy: "no-referrer",
            }).then((response) => {
              let profile = response.json();
              fetch(this.baseUrl + "/roles/" + username, {
                method: "GET",
                mode: "cors",
                referrerPolicy: "no-referrer",
              })
                .then((response2) => {
                  const groups = response.json();
                  resolve({ profile, groups });
                })
                .catch((e) => {
                  reject(e);
                });
            });
          })
          .catch((e) => {
            reject(e);
          });
      });
    }
  
    public async getProfileForLoggedInUser(): Promise<any> {
      let token = localStorage.getItem("auth_token");
  
      const response = await fetch(this.baseUrl + "/get?token=" + token, {
        method: "GET",
        mode: "cors",
        referrerPolicy: "no-referrer",
      });
  
      const { username } = await response.json();
  
      return fetch(this.baseUrl + "/profile/" + username, {
        method: "GET",
        mode: "cors",
        referrerPolicy: "no-referrer",
      }).then((response) => {
        let profile = response.json();
        // consider working with tech lead to add the role info to the profile in the backend, thus saving a call
        fetch(this.baseUrl + "/roles/" + username, {
          method: "GET",
          mode: "cors",
          referrerPolicy: "no-referrer",
        }).then((response2) => {
          const groups = response.json();
          return { profile, groups };
        });
      });
    }
  
    public async logout(): Promise<void> {
      let token: string = localStorage.get("auth_token");
  
      await fetch(this.baseUrl + "/logout", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ token: token }),
      });
  
      localStorage.removeItem("auth_token");

      // remove prior to PR  
      // await fetch(this.baseUrl + "/get?token=" + token, {
      //   method: "GET",
      //   mode: "cors",
      //   referrerPolicy: "no-referrer",
      // });
    }
  }
  
