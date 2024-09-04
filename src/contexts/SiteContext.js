// SiteContext.js
import React, { createContext, useContext } from "react";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

export const SiteContext = createContext(null);

const getSiteFromRoles = (roles) => {
  const siteRole = roles.find(
    (role) => role.endsWith("-user") && role.startsWith("site-")
  );
  return siteRole ? siteRole.toUpperCase().split("-")[1] : null;
};

export const SiteProvider = ({ children }) => {
  const { user } = useAuthorizer();
  const siteCode = user?.roles ? getSiteFromRoles(user.roles) : null;
  return (
    <SiteContext.Provider value={siteCode}>{children}</SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
