# Authentication-Secrets
6 levels of authentication:

        Level 6 - Add Google OAuth 2.0 Authentication to level 5
        
        Level 5 - Cookies and Sessions, salting & hashing automatically with passort-local-mongoose
        commit f12892bbb65dc972f36bed124d0f2111f816b932
        
        Level 4 - Hashing and Salting with bcrypt
        commit b63fa316a104fc148a0979c182fe8287c790ef23

        Level 3 - Hashing with md5
        commit cc17d144d9db3c0dce3b02054f880f604183871b

        Level 2 - Encryption using mongoose-encryption package and environment variable
        commit 210a0a7693d11ef8f9213c6992c047ecc3f6e850

        Level 1 - Store username and password into mongoDB to check
        commit 7ca8f8b04e958c5841cdca3ec8d9604d17293a5a

To see the code after Level 1, simply type this into the terminal: 
"git checkout 7ca8f8b04e958c5841cdca3ec8d9604d17293a5a ."


