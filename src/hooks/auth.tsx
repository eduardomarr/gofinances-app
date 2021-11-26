import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';

import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { CLIENT_ID } = process.env;
const { REDIRECT_URI } = process.env;

interface AuthProviderProps {
  children: ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface AuthContextData {
  user: User;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  signOut(): Promise<void>;
  isLoadingStoragedUser: boolean;
}

interface AuthorizationResponse {
  params: {
    access_token: string;
  };
  type: string;
}

const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User);
  const [isLoadingStoragedUser, setIsLoadingStoragedUser] = useState(true);

  const userStorageKey = '@gofinances:user';

  async function signInWithGoogle() {
    try {
      const RESPONSE_TYPE = 'token';
      const SCOPE = encodeURI('profile email');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;

      const { type, params } = (await AuthSession.startAsync({
        authUrl
      })) as AuthorizationResponse

      if (type === 'success') {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`
        )
        const userInfo = await response.json();

        const loggedUser = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.given_name,
          photo: userInfo.picture
        }

        setUser(loggedUser);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(loggedUser));

      }

    } catch (error) {
      throw new Error(error);
    }
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });

      if (credential) {
        const name = credential.fullName!.givenName!;
        const photo = `https://ui-avatars.com/api/?name=${name}&lenght=1`;

        const loggedUser = {
          id: String(credential.user),
          email: credential.email!,
          name,
          photo,
        };

        setUser(loggedUser);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(loggedUser));
      }

    } catch (error) {
      throw new Error(error);
    }
  }

  async function signOut() {
    setUser({} as User);
    await AsyncStorage.removeItem(userStorageKey);
  }

  useEffect(() => {
    async function loadStoragedUser() {
      const storagedUser = await AsyncStorage.getItem(userStorageKey);

      if (storagedUser) {
        const loggedUser = JSON.parse(storagedUser) as User;
        setUser(loggedUser);
      }

      setIsLoadingStoragedUser(false);
    };

    loadStoragedUser();
  }, []);


  return (
    <AuthContext.Provider value={{
      user,
      signInWithGoogle,
      signInWithApple,
      signOut,
      isLoadingStoragedUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth }

