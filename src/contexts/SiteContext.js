// SiteContext.js
import React, { createContext, useContext } from "react";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

// Context will provide both site code and admin status
export const SiteContext = createContext({ siteCode: null, isAdmin: false });

const getSiteAccess = (roles) => {
  const isAdmin = roles.includes("site-admin");
  const siteRole = roles.find(
    (role) => role.endsWith("-user") && role.startsWith("site-")
  );

  return {
    siteCode: siteRole ? siteRole.toUpperCase().split("-")[1] : null,
    isAdmin,
  };
};

export const SiteProvider = ({ children }) => {
  const { user } = useAuthorizer();
  const siteAccess = user?.roles
    ? getSiteAccess(user.roles)
    : { siteCode: null, isAdmin: false };

  return (
    <SiteContext.Provider value={siteAccess}>{children}</SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
