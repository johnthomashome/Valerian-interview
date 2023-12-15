export class AuthenticationManager {
    private baseUrl: string;
  
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }

    class HttpError extends Error {
      constructor(status, message) {
        super(message);
        this.status = status;
      }
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

    private async validateToken(token): Promise<boolean> {
      try {
        const response = await fetch(this.baseUrl + "/validateToken", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          referrerPolicy: "no-referrer",
          body: JSON.stringify({ token }),
        });
    
        if (!response.ok) {
          throw new HttpError(response.status, "HTTP error");
        }
    
        const valid = await response.json();
        if (valid) {
          return true;
        } else {
          console.debug("clearing auth token because it failed validation");
          localStorage.removeItem("auth_token");
          return false;
        }
      } catch (error) {
        if (error instanceof HttpError) {
          console.error(`HTTP error: ${error.status} - ${error.message}`);
          // reject the promise with the HttpError instance
          reject(error);
        } else {
          console.error("Error validating token:", error);
          reject(error);
        }
      }
    }
  
    public login(username, password, rememberMe): Promise<any> {
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

            this.getProfileForLoggedInUser(token).then((profile, groups) => {
              resolve({ profile, groups });
            };
            // fetch(this.baseUrl + "/profile/" + username, {
            //   method: "GET",
            //   mode: "cors",
            //   referrerPolicy: "no-referrer",
            // }).then((response) => {
            //   let profile = response.json();
            //   fetch(this.baseUrl + "/roles/" + username, {
            //     method: "GET",
            //     mode: "cors",
            //     referrerPolicy: "no-referrer",
            //   })
            //     .then((response2) => {
            //       const groups = response.json();
            //       resolve({ profile, groups });
            //     })
            //     .catch((e) => {
            //       reject(e);
            //     });
            // });
          })
          .catch((e) => {
            reject(e);
          });
      });
    }
  
    public async getProfileForLoggedInUser(): Promise<any> {
      try {
        let token = localStorage.getItem("auth_token");
  
        const response = await fetch(this.baseUrl + "/get?token=" + token, {
          method: "GET",
          mode: "cors",
          referrerPolicy: "no-referrer",
        });
  
        const { username } = await response.json();

        const profileResponse = await fetch(this.baseUrl + "/profile/" + username, {
          method: "GET",
          mode: "cors",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({ token }),
        });
        if (!profileResponse.ok) {
          throw new HttpError(profileResponse.status, "HTTP error");
        }

        const valid = await profileResponse.json();
        let profile = profileResponse.json();
        const rolesResponse = await fetch(this.baseUrl + "/roles/" + username, {
          method: "GET",
          mode: "cors",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({ token }),
        });
        if (!rolesResponse.ok) {
          throw new HttpError(rolesResponse.status, "HTTP error");
        }

        const valid = await rolesResponse.json();
        let roles = rolesResponse.json();
        return { profile, roles };
    } catch (error) {
      if (error instanceof HttpError) {
        console.error(`HTTP error: ${error.status} - ${error.message}`);
        // reject the promise with the HttpError instance
        reject(error);
      } else {
        console.error("Error validating token:", error);
        reject(error);
      }
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
  
      // await fetch(this.baseUrl + "/get?token=" + token, {
      //   method: "GET",
      //   mode: "cors",
      //   referrerPolicy: "no-referrer",
      // });
    }
  }
  
