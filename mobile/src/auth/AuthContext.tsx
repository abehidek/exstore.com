import { ReactNode, createContext, useContext, useEffect } from "react";
import {
  Exact,
  SignInInput,
  SignInMutation,
  SignOutMutation,
  User,
} from "../__gql__/graphql";
import { gql } from "../__gql__";
import {
  ApolloCache,
  DefaultContext,
  MutationFunctionOptions,
  useMutation,
  useQuery,
} from "@apollo/client";
import { Alert } from "react-native";
import { delToken, setToken } from "./token";

export type SignInFn = (
  options?: MutationFunctionOptions<
    SignInMutation,
    Exact<{
      credentials: SignInInput;
    }>,
    DefaultContext,
    ApolloCache<any>
  >
) => Promise<any>;

export type SignOutFn = (
  options?:
    | MutationFunctionOptions<
        SignOutMutation,
        Exact<{
          [key: string]: never;
        }>,
        DefaultContext,
        ApolloCache<any>
      >
    | undefined
) => Promise<any>;

export type AuthContextDataProps =
  | {
      user: undefined;
      token: undefined;
      loading: true;
      error: false;
      signIn: SignInFn;
      signOut: SignOutFn;
    }
  | {
      user: User;
      token: string;
      loading: false;
      error: false;
      signIn: SignInFn;
      signOut: SignOutFn;
    }
  | {
      user: undefined;
      token: undefined;
      loading: false;
      error: true;
      signIn: SignInFn;
      signOut: SignOutFn;
    };

export const AuthContext = createContext<AuthContextDataProps | undefined>(
  undefined
);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const ME = gql(`
    query getMe {
      me {
        token
        id
        userId
        user {
          id name address email cpf insertedAt updatedAt passwordHash
        }
      }
    }
  `);

  const query = useQuery(ME);

  const SIGN_IN = gql(`
    mutation signIn($credentials: SignInInput!) {
      signIn(credentials: $credentials) {
        user {
          id
          address
          cpf
          email
          name
        }
        token
        userId
      }
    }
  `);

  const [signIn] = useMutation(SIGN_IN, {
    onCompleted: async (res) => {
      if (!res.signIn) return;
      Alert.alert("Signed in succesfully!");
      setToken(res.signIn.token).then(() => query.refetch());
    },
    onError: (err) =>
      Alert.alert("Something wrong happened while signing in", err.message),
  });

  const SIGN_OUT = gql(`
    mutation signOut {
      signOut {
        id
        user {
          cpf
          name
          cpf
        }
        token
        userId
      }
    }
  `);

  const [signOut] = useMutation(SIGN_OUT, {
    onCompleted: async (res) => {
      Alert.alert("Signed out succesfully!");
      delToken().then(() => query.refetch());
    },
    onError: (err) => {
      console.log(
        "Something wrong happened while deleting session on server",
        err.message
      );
      delToken().then(() => query.refetch());
    },
  });

  if (query.error)
    return (
      <AuthContext.Provider
        value={{
          loading: false,
          error: true,
          user: undefined,
          token: undefined,
          signIn,
          signOut,
        }}
      >
        {children}
      </AuthContext.Provider>
    );

  if (query.loading || !query.data || !query.data.me)
    return (
      <AuthContext.Provider
        value={{
          loading: true,
          error: false,
          user: undefined,
          token: undefined,
          signIn,
          signOut,
        }}
      >
        {children}
      </AuthContext.Provider>
    );

  return (
    <AuthContext.Provider
      value={{
        loading: false,
        error: false,
        user: query.data.me.user,
        token: query.data.me.token,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextDataProps {
  const context = useContext(AuthContext);

  return context as AuthContextDataProps;
}
