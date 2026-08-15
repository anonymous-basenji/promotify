import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts, useNavigate, Link, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Sparkles, AlertCircle, ArrowRight, ChevronRight, Layers, Users, LogOut, ShieldCheck, X, UserCheck, UserPlus, Shield, Trash2, Plus, History, ExternalLink, Calendar, Clock, MessageSquare, Share2, Save, Edit3, Copy, Search, Check, Undo } from "lucide-react";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const stylesheet = "/assets/app-BHynhFv-.css";
let supabaseUrl = "https://ljouylrbnroeagdepluy.supabase.co/rest/v1/".trim();
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb3V5bHJibnJvZWFnZGVwbHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NDQ5MjUsImV4cCI6MjEwMjMyMDkyNX0.LyQnz9jU-7aF-VPxK8Xe01LuC7IJiFaB7jXJvaxGu_Y".trim();
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    `Promotify One: Supabase configuration missing!
VITE_SUPABASE_PROJECT_URL: ${supabaseUrl ? "FOUND" : "MISSING / EMPTY"}
VITE_SUPABASE_ANON_PUBLIC_KEY: ${supabaseAnonKey ? "FOUND" : "MISSING / EMPTY"}
Please check your .env file in project root.`
  );
}
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
const AuthContext = createContext(void 0);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchProfile = useCallback(async (authUser) => {
    var _a, _b, _c, _d;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).maybeSingle();
      if (error) {
        console.warn("Error loading profile:", error.message);
      }
      if (data) {
        setProfile(data);
      } else {
        const newProfile = {
          user_id: authUser.id,
          email: authUser.email || "",
          full_name: ((_a = authUser.user_metadata) == null ? void 0 : _a.full_name) || ((_b = authUser.user_metadata) == null ? void 0 : _b.name) || ((_c = authUser.email) == null ? void 0 : _c.split("@")[0]) || "User",
          avatar_url: ((_d = authUser.user_metadata) == null ? void 0 : _d.avatar_url) || null
        };
        const { data: inserted, error: insertError } = await supabase.from("profiles").upsert(newProfile).select().single();
        if (!insertError && inserted) {
          setProfile(inserted);
        } else {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error("Failed to sync profile:", err);
    }
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const currentUser = (initialSession == null ? void 0 : initialSession.user) ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      const currentUser = (currentSession == null ? void 0 : currentSession.user) ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/teams` : void 0;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl
        }
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err };
    }
  };
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };
  return /* @__PURE__ */ jsx(
    AuthContext.Provider,
    {
      value: {
        user,
        session,
        profile,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshProfile
      },
      children
    }
  );
}
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
const meta = () => {
  return [{
    title: "Promotify One - Team Facebook Group Promotion Matrix"
  }, {
    name: "description",
    content: "Coordinate festival and campaign promotional schedules across Facebook groups with your team."
  }, {
    name: "viewport",
    content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
  }, {
    name: "theme-color",
    content: "#090d16"
  }];
};
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: stylesheet
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(AuthProvider, {
        children
      }), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: root,
  links,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const _index = UNSAFE_withComponentProps(function Index() {
  const {
    user,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate("/teams", {
          replace: true
        });
      } else {
        navigate("/login", {
          replace: true
        });
      }
    }
  }, [user, isLoading, navigate]);
  return /* @__PURE__ */ jsx("div", {
    className: "login-viewport",
    children: /* @__PURE__ */ jsx(Loader2, {
      size: 36,
      className: "spin text-accent"
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _index
}, Symbol.toStringTag, { value: "Module" }));
const login = UNSAFE_withComponentProps(function Login() {
  const {
    user,
    isLoading,
    signInWithGoogle
  } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/teams", {
        replace: true
      });
    }
  }, [user, isLoading, navigate]);
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    const {
      error
    } = await signInWithGoogle();
    if (error) {
      setAuthError(error.message);
      setIsSigningIn(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      className: "login-viewport",
      children: /* @__PURE__ */ jsx(Loader2, {
        size: 36,
        className: "spin text-accent"
      })
    });
  }
  return /* @__PURE__ */ jsx("div", {
    className: "login-viewport",
    children: /* @__PURE__ */ jsxs("div", {
      className: "login-card",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "login-brand-header",
        children: [/* @__PURE__ */ jsx("div", {
          className: "login-icon-box",
          children: /* @__PURE__ */ jsx(Sparkles, {
            size: 28
          })
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "12px"
          },
          children: [/* @__PURE__ */ jsx("h1", {
            className: "login-title",
            children: "Promotify One"
          }), /* @__PURE__ */ jsx("span", {
            className: "brand-badge",
            children: "BETA"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "login-subtitle",
          children: "Coordinate festival & campaign promotions across Facebook groups with your team."
        })]
      }), authError && /* @__PURE__ */ jsxs("div", {
        className: "alert-banner alert-error",
        style: {
          marginBottom: "20px"
        },
        children: [/* @__PURE__ */ jsx(AlertCircle, {
          size: 16
        }), /* @__PURE__ */ jsx("span", {
          children: authError
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "login-actions",
        children: /* @__PURE__ */ jsx("button", {
          onClick: handleGoogleSignIn,
          disabled: isSigningIn,
          className: "btn-google-signin",
          children: isSigningIn ? /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsx(Loader2, {
              size: 20,
              className: "spin"
            }), /* @__PURE__ */ jsx("span", {
              children: "Connecting to Google..."
            })]
          }) : /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsx("span", {
              children: "Sign in with Google"
            }), /* @__PURE__ */ jsx(ArrowRight, {
              size: 18
            })]
          })
        })
      })]
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
async function apiFetch(path, options = {}) {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session == null ? void 0 : session.access_token;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(path, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = (data == null ? void 0 : data.error) || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}
const teamService = {
  async getUserTeams(_userId) {
    return await apiFetch("/api/teams");
  },
  async getTeamById(teamId, _userId) {
    try {
      return await apiFetch(`/api/teams/${teamId}`);
    } catch (err) {
      console.error("Error fetching team from backend:", err);
      return null;
    }
  },
  async createTeam(name, description, promoText, _userId) {
    return await apiFetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({ name, description, promoText })
    });
  },
  async updateTeamPromoText(teamId, promoText) {
    await apiFetch(`/api/teams/${teamId}/promo`, {
      method: "PATCH",
      body: JSON.stringify({ promoText })
    });
  },
  async getTeamMembers(teamId) {
    return await apiFetch(`/api/teams/${teamId}/members`);
  },
  async addTeamMemberByEmail(teamId, email, role = "member") {
    return await apiFetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ email, role })
    });
  },
  async updateMemberRole(teamMemberId, newRole) {
    await apiFetch(
      `/api/teams/current/members/${teamMemberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role: newRole })
      }
    );
  },
  async removeMember(teamMemberId) {
    await apiFetch(
      `/api/teams/current/members/${teamMemberId}`,
      {
        method: "DELETE"
      }
    );
  }
};
function HeaderBar({ currentTeam, onOpenMembersModal }) {
  var _a;
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  const displayName = (profile == null ? void 0 : profile.full_name) || ((_a = user == null ? void 0 : user.email) == null ? void 0 : _a.split("@")[0]) || "User";
  const avatarUrl = profile == null ? void 0 : profile.avatar_url;
  return /* @__PURE__ */ jsxs("header", { className: "header-bar", children: [
    /* @__PURE__ */ jsxs("div", { className: "brand", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/teams", className: "brand-link", style: { textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }, children: [
        /* @__PURE__ */ jsx("div", { className: "brand-icon", children: /* @__PURE__ */ jsx(Sparkles, { size: 22 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
            /* @__PURE__ */ jsx("h1", { className: "brand-title", children: "Promotify One" }),
            /* @__PURE__ */ jsx("span", { className: "brand-badge", children: "BETA" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "brand-subtitle", children: "Team Promotional Distribution Matrix" })
        ] })
      ] }),
      currentTeam && /* @__PURE__ */ jsxs("div", { className: "team-breadcrumb", children: [
        /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "breadcrumb-separator" }),
        /* @__PURE__ */ jsxs(Link, { to: "/teams", className: "breadcrumb-team-pill", title: "Switch Team", children: [
          /* @__PURE__ */ jsx(Layers, { size: 14 }),
          /* @__PURE__ */ jsx("span", { className: "breadcrumb-team-name", children: currentTeam.name })
        ] }),
        currentTeam.user_role && /* @__PURE__ */ jsx("span", { className: `role-badge role-${currentTeam.user_role}`, children: currentTeam.user_role.toUpperCase() })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "header-actions", children: [
      currentTeam && onOpenMembersModal && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onOpenMembersModal,
          className: "btn-secondary header-btn",
          title: "Team Members & Admins",
          children: [
            /* @__PURE__ */ jsx(Users, { size: 16 }),
            /* @__PURE__ */ jsx("span", { className: "hide-on-mobile", children: "Members" })
          ]
        }
      ),
      user && /* @__PURE__ */ jsxs("div", { className: "user-profile-menu", children: [
        /* @__PURE__ */ jsxs("div", { className: "user-avatar-wrapper", title: (profile == null ? void 0 : profile.email) || user.email || "", children: [
          avatarUrl ? /* @__PURE__ */ jsx("img", { src: avatarUrl, alt: displayName, className: "user-avatar-img" }) : /* @__PURE__ */ jsx("div", { className: "user-avatar-fallback", children: displayName.charAt(0).toUpperCase() }),
          /* @__PURE__ */ jsx("span", { className: "user-name-text hide-on-mobile", children: displayName })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSignOut,
            className: "btn-icon btn-signout",
            title: "Sign Out",
            children: /* @__PURE__ */ jsx(LogOut, { size: 16 })
          }
        )
      ] })
    ] })
  ] });
}
function TeamMembersModal({
  teamId,
  teamName,
  currentUserRole,
  isOpen,
  onClose
}) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";
  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await teamService.getTeamMembers(teamId);
      setMembers(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, loadMembers]);
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await teamService.addTeamMemberByEmail(teamId, inviteEmail, inviteRole);
      setInviteEmail("");
      setSuccessMsg(`Added ${inviteEmail} to ${teamName}!`);
      await loadMembers();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRoleChange = async (member, newRole) => {
    try {
      await teamService.updateMemberRole(member.team_member_id, newRole);
      setMembers(
        (prev) => prev.map(
          (m) => m.team_member_id === member.team_member_id ? { ...m, role: newRole } : m
        )
      );
    } catch (err) {
      setErrorMsg(err.message);
    }
  };
  const handleRemoveMember = async (member) => {
    var _a, _b;
    const memberName = ((_a = member.profile) == null ? void 0 : _a.full_name) || ((_b = member.profile) == null ? void 0 : _b.email) || "this user";
    if (!confirm(`Are you sure you want to remove ${memberName} from ${teamName}?`)) {
      return;
    }
    try {
      await teamService.removeMember(member.team_member_id);
      setMembers((prev) => prev.filter((m) => m.team_member_id !== member.team_member_id));
    } catch (err) {
      setErrorMsg(err.message);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "modal-content modal-md", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsx(ShieldCheck, { size: 22, className: "text-accent" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "modal-title", children: "Team Roster & Admins" }),
          /* @__PURE__ */ jsx("p", { className: "modal-subtitle", children: teamName })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "btn-close", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "modal-body", children: [
      errorMsg && /* @__PURE__ */ jsxs("div", { className: "alert-banner alert-error", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: errorMsg })
      ] }),
      successMsg && /* @__PURE__ */ jsxs("div", { className: "alert-banner alert-success", children: [
        /* @__PURE__ */ jsx(UserCheck, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: successMsg })
      ] }),
      canManageMembers && /* @__PURE__ */ jsxs("form", { onSubmit: handleAddMember, className: "member-invite-box", children: [
        /* @__PURE__ */ jsx("h4", { className: "section-small-title", children: "Add Team Member" }),
        /* @__PURE__ */ jsx("p", { className: "text-secondary", style: { fontSize: "0.85rem", marginBottom: "10px" }, children: "Enter the email address of a user who has signed into Promotify One." }),
        /* @__PURE__ */ jsxs("div", { className: "invite-inputs-row", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              placeholder: "name@example.com",
              value: inviteEmail,
              onChange: (e) => setInviteEmail(e.target.value),
              className: "input-field",
              required: true
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: inviteRole,
              onChange: (e) => setInviteRole(e.target.value),
              className: "select-field role-select",
              children: [
                /* @__PURE__ */ jsx("option", { value: "member", children: "Member" }),
                /* @__PURE__ */ jsx("option", { value: "admin", children: "Admin" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: isSubmitting || !inviteEmail.trim(),
              className: "btn-primary invite-btn",
              children: isSubmitting ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(UserPlus, { size: 16 }),
                /* @__PURE__ */ jsx("span", { children: "Add" })
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "members-list-wrapper", children: [
        /* @__PURE__ */ jsxs("h4", { className: "section-small-title", style: { marginTop: "16px", marginBottom: "10px" }, children: [
          "Members (",
          members.length,
          ")"
        ] }),
        isLoading ? /* @__PURE__ */ jsxs("div", { className: "loading-state", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 24, className: "spin text-accent" }),
          /* @__PURE__ */ jsx("p", { children: "Loading members..." })
        ] }) : members.length === 0 ? /* @__PURE__ */ jsx("p", { className: "empty-text", children: "No members found." }) : /* @__PURE__ */ jsx("div", { className: "members-list", children: members.map((member) => {
          var _a, _b, _c, _d, _e;
          const isSelf = member.user_id === (user == null ? void 0 : user.id);
          const isOwner = member.role === "owner";
          const displayName = ((_a = member.profile) == null ? void 0 : _a.full_name) || ((_c = (_b = member.profile) == null ? void 0 : _b.email) == null ? void 0 : _c.split("@")[0]) || "Member";
          return /* @__PURE__ */ jsxs("div", { className: "member-row", children: [
            /* @__PURE__ */ jsxs("div", { className: "member-info", children: [
              ((_d = member.profile) == null ? void 0 : _d.avatar_url) ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: member.profile.avatar_url,
                  alt: displayName,
                  className: "member-avatar-img"
                }
              ) : /* @__PURE__ */ jsx("div", { className: "member-avatar-fallback", children: displayName.charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "member-name", children: displayName }),
                  isSelf && /* @__PURE__ */ jsx("span", { className: "tag-self", children: "You" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "member-email", children: ((_e = member.profile) == null ? void 0 : _e.email) || "No email" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "member-actions", children: [
              canManageMembers && !isOwner && !isSelf ? /* @__PURE__ */ jsxs(
                "select",
                {
                  value: member.role,
                  onChange: (e) => handleRoleChange(member, e.target.value),
                  className: `role-badge-select role-${member.role}`,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "member", children: "Member" }),
                    /* @__PURE__ */ jsx("option", { value: "admin", children: "Admin" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("span", { className: `role-badge role-${member.role}`, children: isOwner ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Shield, { size: 12, style: { marginRight: "4px" } }),
                "OWNER"
              ] }) : member.role.toUpperCase() }),
              canManageMembers && !isOwner && !isSelf && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleRemoveMember(member),
                  className: "btn-icon btn-danger-soft",
                  title: "Remove member",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                }
              )
            ] })
          ] }, member.team_member_id);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "modal-footer", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "btn-secondary", children: "Done" }) })
  ] }) });
}
const teams = UNSAFE_withComponentProps(function Teams() {
  const {
    user,
    isLoading: isAuthLoading
  } = useAuth();
  const navigate = useNavigate();
  const [teams2, setTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamPromoText, setTeamPromoText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeManagingTeam, setActiveManagingTeam] = useState(null);
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login", {
        replace: true
      });
    }
  }, [user, isAuthLoading, navigate]);
  const loadTeams = useCallback(async () => {
    if (!user) return;
    setIsLoadingTeams(true);
    setErrorMsg(null);
    try {
      const data = await teamService.getUserTeams(user.id);
      setTeams(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load teams");
    } finally {
      setIsLoadingTeams(false);
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user, loadTeams]);
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!user || !teamName.trim()) return;
    setIsCreating(true);
    setErrorMsg(null);
    try {
      const newTeam = await teamService.createTeam(teamName, teamDescription, teamPromoText, user.id);
      setIsCreateModalOpen(false);
      setTeamName("");
      setTeamDescription("");
      setTeamPromoText("");
      navigate(`/teams/${newTeam.team_id}`);
    } catch (err) {
      setErrorMsg(err.message);
      setIsCreating(false);
    }
  };
  if (isAuthLoading || isLoadingTeams && teams2.length === 0) {
    return /* @__PURE__ */ jsx("div", {
      className: "app-container",
      children: /* @__PURE__ */ jsxs("div", {
        className: "login-viewport",
        children: [/* @__PURE__ */ jsx(Loader2, {
          size: 36,
          className: "spin text-accent"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            marginTop: "12px",
            color: "var(--text-secondary)"
          },
          children: "Loading workspaces..."
        })]
      })
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "app-container",
    children: [/* @__PURE__ */ jsx(HeaderBar, {}), /* @__PURE__ */ jsxs("main", {
      className: "teams-view-content",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "teams-header-row",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h2", {
            className: "page-title",
            children: "Your Workspaces"
          }), /* @__PURE__ */ jsx("p", {
            className: "page-subtitle",
            children: "Select a festival or campaign team to manage its Facebook group promotion roster."
          })]
        }), /* @__PURE__ */ jsxs("button", {
          onClick: () => setIsCreateModalOpen(true),
          className: "btn-primary create-team-btn",
          children: [/* @__PURE__ */ jsx(Plus, {
            size: 18
          }), /* @__PURE__ */ jsx("span", {
            children: "Create Team"
          })]
        })]
      }), errorMsg && /* @__PURE__ */ jsxs("div", {
        className: "alert-banner alert-error",
        style: {
          marginBottom: "20px"
        },
        children: [/* @__PURE__ */ jsx(AlertCircle, {
          size: 16
        }), /* @__PURE__ */ jsx("span", {
          children: errorMsg
        })]
      }), teams2.length === 0 ? /* @__PURE__ */ jsxs("div", {
        className: "empty-teams-card",
        children: [/* @__PURE__ */ jsx("div", {
          className: "empty-icon-circle",
          children: /* @__PURE__ */ jsx(Layers, {
            size: 36,
            className: "text-accent"
          })
        }), /* @__PURE__ */ jsx("h3", {
          className: "empty-title",
          children: "No teams found"
        }), /* @__PURE__ */ jsx("p", {
          className: "empty-subtitle",
          children: "Get started by creating your first festival or campaign team workspace."
        }), /* @__PURE__ */ jsxs("button", {
          onClick: () => setIsCreateModalOpen(true),
          className: "btn-primary",
          style: {
            marginTop: "16px"
          },
          children: [/* @__PURE__ */ jsx(Plus, {
            size: 18
          }), /* @__PURE__ */ jsx("span", {
            children: "Create Your First Team"
          })]
        })]
      }) : /* @__PURE__ */ jsx("div", {
        className: "teams-grid",
        children: teams2.map((team) => {
          const isAdmin = team.user_role === "owner" || team.user_role === "admin";
          return /* @__PURE__ */ jsxs("div", {
            className: "team-card",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "team-card-header",
              children: [/* @__PURE__ */ jsx("div", {
                className: "team-card-icon",
                children: /* @__PURE__ */ jsx(Layers, {
                  size: 22
                })
              }), team.user_role && /* @__PURE__ */ jsx("span", {
                className: `role-badge role-${team.user_role}`,
                children: team.user_role === "owner" ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(ShieldCheck, {
                    size: 12,
                    style: {
                      marginRight: "4px"
                    }
                  }), "OWNER"]
                }) : team.user_role.toUpperCase()
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "team-card-body",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "team-card-title",
                children: team.name
              }), /* @__PURE__ */ jsx("p", {
                className: "team-card-desc",
                children: team.description || "No description provided."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "team-card-footer",
              children: [/* @__PURE__ */ jsxs("button", {
                onClick: () => setActiveManagingTeam(team),
                className: "btn-secondary team-members-btn",
                title: "Manage members and admins",
                children: [/* @__PURE__ */ jsx(Users, {
                  size: 16
                }), /* @__PURE__ */ jsx("span", {
                  children: isAdmin ? "Manage Members" : "View Members"
                })]
              }), /* @__PURE__ */ jsxs(Link, {
                to: `/teams/${team.team_id}`,
                className: "btn-primary team-enter-btn",
                children: [/* @__PURE__ */ jsx("span", {
                  children: "Open"
                }), /* @__PURE__ */ jsx(ArrowRight, {
                  size: 16
                })]
              })]
            })]
          }, team.team_id);
        })
      })]
    }), isCreateModalOpen && /* @__PURE__ */ jsx("div", {
      className: "modal-backdrop",
      onClick: () => setIsCreateModalOpen(false),
      children: /* @__PURE__ */ jsxs("div", {
        className: "modal-content modal-md",
        onClick: (e) => e.stopPropagation(),
        children: [/* @__PURE__ */ jsxs("div", {
          className: "modal-header",
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px"
            },
            children: [/* @__PURE__ */ jsx(Sparkles, {
              size: 22,
              className: "text-accent"
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h2", {
                className: "modal-title",
                children: "Create Team Workspace"
              }), /* @__PURE__ */ jsx("p", {
                className: "modal-subtitle",
                children: "Set up a new festival or promotion campaign"
              })]
            })]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setIsCreateModalOpen(false),
            className: "btn-close",
            children: /* @__PURE__ */ jsx(X, {
              size: 20
            })
          })]
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleCreateTeam,
          children: [/* @__PURE__ */ jsxs("div", {
            className: "modal-body",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Team Name *"
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                required: true,
                placeholder: "e.g. Greek Festival 2026 or Fall Festival",
                value: teamName,
                onChange: (e) => setTeamName(e.target.value),
                className: "input-field",
                autoFocus: true
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Description (Optional)"
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                placeholder: "e.g. Social media promotion team for September event",
                value: teamDescription,
                onChange: (e) => setTeamDescription(e.target.value),
                className: "input-field"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Default Promo Post Text (Optional)"
              }), /* @__PURE__ */ jsx("textarea", {
                rows: 4,
                placeholder: "Enter the template post text your team will copy-paste to Facebook groups...",
                value: teamPromoText,
                onChange: (e) => setTeamPromoText(e.target.value),
                className: "textarea-field"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "modal-footer",
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => setIsCreateModalOpen(false),
              className: "btn-secondary",
              children: "Cancel"
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              disabled: isCreating || !teamName.trim(),
              className: "btn-primary",
              children: isCreating ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Loader2, {
                  size: 16,
                  className: "spin"
                }), /* @__PURE__ */ jsx("span", {
                  children: "Creating..."
                })]
              }) : /* @__PURE__ */ jsx("span", {
                children: "Create Team"
              })
            })]
          })]
        })]
      })
    }), activeManagingTeam && /* @__PURE__ */ jsx(TeamMembersModal, {
      teamId: activeManagingTeam.team_id,
      teamName: activeManagingTeam.name,
      currentUserRole: activeManagingTeam.user_role || "member",
      isOpen: true,
      onClose: () => setActiveManagingTeam(null)
    })]
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: teams
}, Symbol.toStringTag, { value: "Module" }));
const groupService = {
  async getTeamGroups(teamId) {
    return await apiFetch(`/api/groups/team/${teamId}`);
  },
  async createGroup(teamId, _userId, input) {
    return await apiFetch(`/api/groups/team/${teamId}`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async updateGroup(groupId, input) {
    await apiFetch(`/api/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(input)
    });
  },
  async deleteGroup(groupId) {
    await apiFetch(`/api/groups/${groupId}`, {
      method: "DELETE"
    });
  }
};
const postService = {
  async getTeamPostLogsToday(teamId, dateStr) {
    return await apiFetch(
      `/api/posts/team/${teamId}/today?date=${encodeURIComponent(dateStr)}`
    );
  },
  async getTeamPostCounts(teamId) {
    return await apiFetch(`/api/posts/team/${teamId}/counts`);
  },
  async getGroupPostHistory(groupId) {
    return await apiFetch(`/api/posts/group/${groupId}/history`);
  },
  async logPost(groupId, teamId, _userId, dateStr, notes, postUrl) {
    return await apiFetch(`/api/posts/team/${teamId}`, {
      method: "POST",
      body: JSON.stringify({ groupId, dateStr, notes, postUrl })
    });
  },
  async removePostLog(postLogId) {
    await apiFetch(`/api/posts/${postLogId}`, {
      method: "DELETE"
    });
  }
};
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
function PostHistoryDrawer({
  group,
  isOpen,
  onClose,
  onPostDeleted
}) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadHistory = useCallback(async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      const data = await postService.getGroupPostHistory(group.facebook_group_id);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load group post history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [group]);
  useEffect(() => {
    if (isOpen && group) {
      loadHistory();
    }
  }, [isOpen, group, loadHistory]);
  const handleDeletePost = async (postLogId) => {
    if (!confirm("Are you sure you want to delete this post log entry?")) return;
    try {
      await postService.removePostLog(postLogId);
      setLogs((prev) => prev.filter((p) => p.post_log_id !== postLogId));
      if (onPostDeleted) onPostDeleted();
    } catch (err) {
      console.error("Failed to delete post log:", err);
    }
  };
  if (!isOpen || !group) return null;
  return /* @__PURE__ */ jsx("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "modal-content modal-md", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsx(History, { size: 22, className: "text-accent" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "modal-title", children: "Group Post History" }),
          /* @__PURE__ */ jsx("p", { className: "modal-subtitle", children: group.name })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "btn-close", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "modal-body", children: [
      group.group_url && /* @__PURE__ */ jsxs(
        "a",
        {
          href: group.group_url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "group-direct-link",
          style: { marginBottom: "16px", display: "inline-flex" },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Open Group on Facebook" }),
            /* @__PURE__ */ jsx(ExternalLink, { size: 14 })
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "history-timeline", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "loading-state", children: [
        /* @__PURE__ */ jsx(Loader2, { size: 24, className: "spin text-accent" }),
        /* @__PURE__ */ jsx("p", { children: "Loading history..." })
      ] }) : logs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "empty-history-state", children: [
        /* @__PURE__ */ jsx("p", { className: "empty-text", children: "No posts have been logged for this group yet." }),
        /* @__PURE__ */ jsx("p", { className: "text-muted", style: { fontSize: "0.85rem" }, children: 'Click "Mark as Posted" on the dashboard when you share promo copy here.' })
      ] }) : logs.map((log) => {
        var _a, _b, _c, _d;
        const posterName = ((_a = log.poster_profile) == null ? void 0 : _a.full_name) || ((_c = (_b = log.poster_profile) == null ? void 0 : _b.email) == null ? void 0 : _c.split("@")[0]) || "Team Member";
        const postTime = new Date(log.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
        const postDate = new Date(log.created_at).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        return /* @__PURE__ */ jsxs("div", { className: "timeline-item", children: [
          /* @__PURE__ */ jsx("div", { className: "timeline-dot" }),
          /* @__PURE__ */ jsxs("div", { className: "timeline-card", children: [
            /* @__PURE__ */ jsxs("div", { className: "timeline-header", children: [
              /* @__PURE__ */ jsxs("div", { className: "timeline-user", children: [
                ((_d = log.poster_profile) == null ? void 0 : _d.avatar_url) ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: log.poster_profile.avatar_url,
                    alt: posterName,
                    className: "timeline-avatar"
                  }
                ) : /* @__PURE__ */ jsx("div", { className: "timeline-avatar-fallback", children: posterName.charAt(0).toUpperCase() }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "timeline-user-name", children: posterName }),
                  /* @__PURE__ */ jsxs("div", { className: "timeline-date-time", children: [
                    /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "4px" }, children: [
                      /* @__PURE__ */ jsx(Calendar, { size: 12 }),
                      " ",
                      postDate
                    ] }),
                    /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "4px" }, children: [
                      /* @__PURE__ */ jsx(Clock, { size: 12 }),
                      " ",
                      postTime
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDeletePost(log.post_log_id),
                  className: "btn-icon btn-danger-soft",
                  title: "Delete entry",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                }
              )
            ] }),
            log.notes && /* @__PURE__ */ jsxs("div", { className: "timeline-notes", children: [
              /* @__PURE__ */ jsx(MessageSquare, { size: 13, style: { flexShrink: 0, marginTop: "2px" } }),
              /* @__PURE__ */ jsx("span", { children: log.notes })
            ] }),
            log.post_url && /* @__PURE__ */ jsxs(
              "a",
              {
                href: log.post_url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "timeline-post-link",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "View Post" }),
                  /* @__PURE__ */ jsx(ExternalLink, { size: 12 })
                ]
              }
            )
          ] })
        ] }, log.post_log_id);
      }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "modal-footer", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "btn-secondary", children: "Close" }) })
  ] }) });
}
const teams_$teamId = UNSAFE_withComponentProps(function TeamDashboard() {
  const {
    teamId
  } = useParams();
  const {
    user,
    isLoading: isAuthLoading
  } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [groups, setGroups] = useState([]);
  const [todayPosts, setTodayPosts] = useState({});
  const [postCounts, setPostCounts] = useState({});
  const [promoText, setPromoText] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isEditingPromo, setIsEditingPromo] = useState(false);
  const [tempPromoText, setTempPromoText] = useState("");
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [showRestrictedOnly, setShowRestrictedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [historyDrawerGroup, setHistoryDrawerGroup] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDays, setFormDays] = useState({
    Sunday: true,
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true
  });
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const todayStr = useMemo(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0], []);
  const todayDayName = useMemo(() => {
    const dayIndex = (/* @__PURE__ */ new Date()).getDay();
    return DAYS_OF_WEEK[dayIndex];
  }, []);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login", {
        replace: true
      });
    }
  }, [user, isAuthLoading, navigate]);
  const loadDashboardData = useCallback(async () => {
    if (!teamId || !user) return;
    setIsLoadingDashboard(true);
    setErrorMsg(null);
    try {
      const teamData = await teamService.getTeamById(teamId, user.id);
      if (!teamData) {
        setErrorMsg("Team workspace not found or you do not have permission to view it.");
        setIsLoadingDashboard(false);
        return;
      }
      setTeam(teamData);
      setPromoText(teamData.promo_text || "");
      setTempPromoText(teamData.promo_text || "");
      const groupData = await groupService.getTeamGroups(teamId);
      setGroups(groupData);
      const [todayLogs, counts] = await Promise.all([postService.getTeamPostLogsToday(teamId, todayStr), postService.getTeamPostCounts(teamId)]);
      setTodayPosts(todayLogs);
      setPostCounts(counts);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load team data");
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [teamId, user, todayStr]);
  useEffect(() => {
    if (user && teamId) {
      loadDashboardData();
    }
  }, [user, teamId, loadDashboardData]);
  const handleCopyPromoText = () => {
    if (!promoText) return;
    navigator.clipboard.writeText(promoText);
    triggerToast("Promo text copied to clipboard! 📋");
  };
  const handleSavePromoText = async () => {
    if (!teamId) return;
    setIsSavingPromo(true);
    try {
      await teamService.updateTeamPromoText(teamId, tempPromoText);
      setPromoText(tempPromoText);
      setIsEditingPromo(false);
      triggerToast("Promo text updated! 💾");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSavingPromo(false);
    }
  };
  const handleOpenAddGroupModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormUrl("");
    setFormNotes("");
    setFormDays({
      Sunday: true,
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true
    });
    setIsGroupModalOpen(true);
  };
  const handleOpenEditGroupModal = (group) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormUrl(group.group_url || "");
    setFormNotes(group.notes || "");
    const daysMap = {
      Sunday: false,
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false
    };
    group.allowed_days.forEach((d) => {
      daysMap[d] = true;
    });
    setFormDays(daysMap);
    setIsGroupModalOpen(true);
  };
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!teamId || !user || !formName.trim()) return;
    setIsSavingGroup(true);
    setErrorMsg(null);
    const selectedAllowedDays = Object.keys(formDays).filter((d) => formDays[d]);
    try {
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.facebook_group_id, {
          name: formName,
          group_url: formUrl,
          notes: formNotes,
          allowed_days: selectedAllowedDays
        });
        triggerToast("Group updated! ✨");
      } else {
        await groupService.createGroup(teamId, user.id, {
          name: formName,
          group_url: formUrl,
          notes: formNotes,
          allowed_days: selectedAllowedDays
        });
        triggerToast("Group added to team! 🚀");
      }
      setIsGroupModalOpen(false);
      const updatedGroups = await groupService.getTeamGroups(teamId);
      setGroups(updatedGroups);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSavingGroup(false);
    }
  };
  const handleDeleteGroup = async (groupId, groupName) => {
    if (!confirm(`Are you sure you want to delete "${groupName}" from this team?`)) {
      return;
    }
    try {
      await groupService.deleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.facebook_group_id !== groupId));
      triggerToast("Group deleted.");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };
  const handleMarkPosted = async (groupId) => {
    if (!teamId || !user) return;
    try {
      const newLog = await postService.logPost(groupId, teamId, user.id, todayStr);
      setTodayPosts((prev) => ({
        ...prev,
        [groupId]: newLog
      }));
      setPostCounts((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || 0) + 1
      }));
      triggerToast("Post recorded! 🎉");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };
  const handleUnmarkPosted = async (groupId) => {
    const postLog = todayPosts[groupId];
    if (!postLog) return;
    try {
      await postService.removePostLog(postLog.post_log_id);
      setTodayPosts((prev) => {
        const next = {
          ...prev
        };
        delete next[groupId];
        return next;
      });
      setPostCounts((prev) => ({
        ...prev,
        [groupId]: Math.max(0, (prev[groupId] || 1) - 1)
      }));
      triggerToast("Post unmarked.");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };
  const activeDayName = selectedFilter === "today" ? todayDayName : selectedFilter === "all" ? todayDayName : selectedFilter;
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      var _a, _b, _c;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = group.name.toLowerCase().includes(query);
        const matchesNotes = (_a = group.notes) == null ? void 0 : _a.toLowerCase().includes(query);
        const matchesCreator = (_c = (_b = group.creator_profile) == null ? void 0 : _b.full_name) == null ? void 0 : _c.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes && !matchesCreator) {
          return false;
        }
      }
      if (selectedFilter !== "all") {
        const allowsDay = group.allowed_days.includes(activeDayName);
        if (!allowsDay) return false;
      }
      if (showRestrictedOnly && !group.notes) {
        return false;
      }
      return true;
    });
  }, [groups, searchQuery, selectedFilter, activeDayName, showRestrictedOnly]);
  const stats = useMemo(() => {
    const activeDayGroups = groups.filter((g) => g.allowed_days.includes(activeDayName));
    const postedCount = activeDayGroups.filter((g) => !!todayPosts[g.facebook_group_id]).length;
    const totalCount = activeDayGroups.length;
    const progressPercent = totalCount > 0 ? Math.round(postedCount / totalCount * 100) : 0;
    return {
      postedCount,
      totalCount,
      progressPercent
    };
  }, [groups, todayPosts, activeDayName]);
  if (isAuthLoading || isLoadingDashboard && !team) {
    return /* @__PURE__ */ jsx("div", {
      className: "app-container",
      children: /* @__PURE__ */ jsxs("div", {
        className: "login-viewport",
        children: [/* @__PURE__ */ jsx(Loader2, {
          size: 36,
          className: "spin text-accent"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            marginTop: "12px",
            color: "var(--text-secondary)"
          },
          children: "Loading team dashboard..."
        })]
      })
    });
  }
  if (!team) {
    return /* @__PURE__ */ jsxs("div", {
      className: "app-container",
      children: [/* @__PURE__ */ jsx(HeaderBar, {}), /* @__PURE__ */ jsxs("div", {
        className: "empty-teams-card",
        children: [/* @__PURE__ */ jsx(AlertCircle, {
          size: 36,
          className: "text-accent",
          style: {
            margin: "0 auto 12px auto"
          }
        }), /* @__PURE__ */ jsx("h3", {
          className: "empty-title",
          children: "Team Not Found"
        }), /* @__PURE__ */ jsx("p", {
          className: "empty-subtitle",
          children: errorMsg || "This team workspace could not be found or you are not a member."
        })]
      })]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "app-container",
    children: [/* @__PURE__ */ jsx(HeaderBar, {
      currentTeam: team,
      onOpenMembersModal: () => setIsMembersModalOpen(true)
    }), toastMessage && /* @__PURE__ */ jsx("div", {
      className: "toast",
      children: /* @__PURE__ */ jsx("span", {
        children: toastMessage
      })
    }), errorMsg && /* @__PURE__ */ jsxs("div", {
      className: "alert-banner alert-error",
      style: {
        marginBottom: "16px"
      },
      children: [/* @__PURE__ */ jsx(AlertCircle, {
        size: 16
      }), /* @__PURE__ */ jsx("span", {
        children: errorMsg
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setErrorMsg(null),
        className: "btn-icon",
        style: {
          marginLeft: "auto"
        },
        children: /* @__PURE__ */ jsx(X, {
          size: 14
        })
      })]
    }), /* @__PURE__ */ jsxs("main", {
      className: "dashboard-content",
      children: [/* @__PURE__ */ jsxs("section", {
        className: "promo-text-card",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "promo-card-header",
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px"
            },
            children: [/* @__PURE__ */ jsx(Share2, {
              size: 18,
              className: "text-accent"
            }), /* @__PURE__ */ jsx("h3", {
              className: "section-title",
              children: "Team Promo Post Copy"
            })]
          }), /* @__PURE__ */ jsx("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px"
            },
            children: isEditingPromo ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx("button", {
                onClick: () => {
                  setTempPromoText(promoText);
                  setIsEditingPromo(false);
                },
                className: "btn-secondary btn-sm",
                children: "Cancel"
              }), /* @__PURE__ */ jsxs("button", {
                onClick: handleSavePromoText,
                disabled: isSavingPromo,
                className: "btn-primary btn-sm",
                children: [isSavingPromo ? /* @__PURE__ */ jsx(Loader2, {
                  size: 14,
                  className: "spin"
                }) : /* @__PURE__ */ jsx(Save, {
                  size: 14
                }), /* @__PURE__ */ jsx("span", {
                  children: "Save"
                })]
              })]
            }) : /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs("button", {
                onClick: () => setIsEditingPromo(true),
                className: "btn-secondary btn-sm",
                title: "Edit promo template",
                children: [/* @__PURE__ */ jsx(Edit3, {
                  size: 14
                }), /* @__PURE__ */ jsx("span", {
                  children: "Edit Copy"
                })]
              }), /* @__PURE__ */ jsxs("button", {
                onClick: handleCopyPromoText,
                className: "btn-primary btn-sm copy-btn",
                title: "Copy to clipboard",
                children: [/* @__PURE__ */ jsx(Copy, {
                  size: 14
                }), /* @__PURE__ */ jsx("span", {
                  children: "Copy Text"
                })]
              })]
            })
          })]
        }), isEditingPromo ? /* @__PURE__ */ jsx("textarea", {
          rows: 4,
          value: tempPromoText,
          onChange: (e) => setTempPromoText(e.target.value),
          placeholder: "Enter your team's promo copy template here...",
          className: "textarea-field promo-edit-textarea",
          autoFocus: true
        }) : /* @__PURE__ */ jsx("div", {
          className: "promo-preview-box",
          onClick: handleCopyPromoText,
          title: "Click to copy",
          children: /* @__PURE__ */ jsx("p", {
            className: "promo-preview-text",
            children: promoText || 'No promo text set yet. Click "Edit Copy" to add your promo message!'
          })
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "controls-section",
        children: [/* @__PURE__ */ jsx("div", {
          className: "day-tabs-scroll",
          children: /* @__PURE__ */ jsxs("div", {
            className: "day-tabs-container",
            children: [/* @__PURE__ */ jsxs("button", {
              onClick: () => setSelectedFilter("today"),
              className: `day-tab ${selectedFilter === "today" ? "active" : ""}`,
              children: [/* @__PURE__ */ jsx(Calendar, {
                size: 14
              }), /* @__PURE__ */ jsxs("span", {
                children: ["Today (", todayDayName.slice(0, 3), ")"]
              })]
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setSelectedFilter("all"),
              className: `day-tab ${selectedFilter === "all" ? "active" : ""}`,
              children: /* @__PURE__ */ jsx("span", {
                children: "All Groups"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "day-tab-divider"
            }), DAYS_OF_WEEK.map((day) => /* @__PURE__ */ jsx("button", {
              onClick: () => setSelectedFilter(day),
              className: `day-tab ${selectedFilter === day ? "active" : ""}`,
              children: /* @__PURE__ */ jsx("span", {
                children: day.slice(0, 3)
              })
            }, day))]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "filter-actions-bar",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "search-input-wrapper",
            children: [/* @__PURE__ */ jsx(Search, {
              size: 16,
              className: "search-icon"
            }), /* @__PURE__ */ jsx("input", {
              type: "text",
              placeholder: "Search groups, notes, creator...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "search-input"
            }), searchQuery && /* @__PURE__ */ jsx("button", {
              onClick: () => setSearchQuery(""),
              className: "btn-clear-search",
              children: /* @__PURE__ */ jsx(X, {
                size: 14
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "filter-options",
            children: [/* @__PURE__ */ jsxs("label", {
              className: "toggle-label",
              children: [/* @__PURE__ */ jsx("input", {
                type: "checkbox",
                checked: showRestrictedOnly,
                onChange: (e) => setShowRestrictedOnly(e.target.checked)
              }), /* @__PURE__ */ jsx("span", {
                children: "Notes Only"
              })]
            }), /* @__PURE__ */ jsxs("button", {
              onClick: handleOpenAddGroupModal,
              className: "btn-primary btn-sm add-group-btn",
              children: [/* @__PURE__ */ jsx(Plus, {
                size: 16
              }), /* @__PURE__ */ jsx("span", {
                children: "Add Group"
              })]
            })]
          })]
        }), selectedFilter !== "all" && /* @__PURE__ */ jsxs("div", {
          className: "progress-banner",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "progress-info",
            children: [/* @__PURE__ */ jsx("span", {
              className: "progress-label",
              children: selectedFilter === "today" ? "Today's Progress" : `${activeDayName}'s Progress`
            }), /* @__PURE__ */ jsxs("span", {
              className: "progress-counts",
              children: [stats.postedCount, " of ", stats.totalCount, " groups posted (", stats.progressPercent, "%)"]
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "progress-track",
            children: /* @__PURE__ */ jsx("div", {
              className: "progress-bar-fill",
              style: {
                width: `${stats.progressPercent}%`
              }
            })
          })]
        })]
      }), /* @__PURE__ */ jsx("section", {
        className: "groups-section",
        children: filteredGroups.length === 0 ? /* @__PURE__ */ jsxs("div", {
          className: "empty-groups-state",
          children: [/* @__PURE__ */ jsx("div", {
            className: "empty-icon-circle",
            children: /* @__PURE__ */ jsx(Calendar, {
              size: 32,
              className: "text-accent"
            })
          }), /* @__PURE__ */ jsx("h4", {
            className: "empty-title",
            children: "No groups found"
          }), /* @__PURE__ */ jsx("p", {
            className: "empty-subtitle",
            children: groups.length === 0 ? "Get started by adding your first Facebook group to this team!" : "No groups match your current filter or day selection."
          }), groups.length === 0 && /* @__PURE__ */ jsxs("button", {
            onClick: handleOpenAddGroupModal,
            className: "btn-primary",
            style: {
              marginTop: "14px"
            },
            children: [/* @__PURE__ */ jsx(Plus, {
              size: 16
            }), /* @__PURE__ */ jsx("span", {
              children: "Add First Facebook Group"
            })]
          })]
        }) : /* @__PURE__ */ jsx("div", {
          className: "groups-list",
          children: filteredGroups.map((group) => {
            var _a, _b, _c, _d, _e, _f;
            const todayLog = todayPosts[group.facebook_group_id];
            const isPostedToday = !!todayLog;
            const totalGroupPosts = postCounts[group.facebook_group_id] || 0;
            const creatorName = ((_a = group.creator_profile) == null ? void 0 : _a.full_name) || ((_c = (_b = group.creator_profile) == null ? void 0 : _b.email) == null ? void 0 : _c.split("@")[0]) || "Team";
            const posterName = ((_d = todayLog == null ? void 0 : todayLog.poster_profile) == null ? void 0 : _d.full_name) || ((_f = (_e = todayLog == null ? void 0 : todayLog.poster_profile) == null ? void 0 : _e.email) == null ? void 0 : _f.split("@")[0]) || "Team Member";
            const postedTime = todayLog ? new Date(todayLog.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            }) : null;
            return /* @__PURE__ */ jsxs("div", {
              className: `group-card ${isPostedToday ? "group-posted" : ""}`,
              children: [/* @__PURE__ */ jsxs("div", {
                className: "group-card-main",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "group-header-line",
                  children: [/* @__PURE__ */ jsx("h4", {
                    className: "group-name",
                    children: group.name
                  }), group.group_url && /* @__PURE__ */ jsxs("a", {
                    href: group.group_url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "group-url-badge",
                    title: "Open on Facebook",
                    children: [/* @__PURE__ */ jsx("span", {
                      children: "Open"
                    }), /* @__PURE__ */ jsx(ExternalLink, {
                      size: 12
                    })]
                  })]
                }), group.notes && /* @__PURE__ */ jsxs("div", {
                  className: "group-notes-box",
                  children: [/* @__PURE__ */ jsx(AlertCircle, {
                    size: 14,
                    className: "notes-icon"
                  }), /* @__PURE__ */ jsx("span", {
                    children: group.notes
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "group-meta-row",
                  children: [/* @__PURE__ */ jsxs("span", {
                    className: "meta-chip creator-chip",
                    title: "Added to team by",
                    children: ["Added by ", creatorName]
                  }), /* @__PURE__ */ jsxs("button", {
                    onClick: () => setHistoryDrawerGroup(group),
                    className: "meta-chip history-chip",
                    title: "View complete post history",
                    children: [/* @__PURE__ */ jsx(History, {
                      size: 12
                    }), /* @__PURE__ */ jsxs("span", {
                      children: [totalGroupPosts, " ", totalGroupPosts === 1 ? "post" : "posts", " logged"]
                    })]
                  }), /* @__PURE__ */ jsx("div", {
                    className: "group-days-chips",
                    children: DAYS_OF_WEEK.map((day) => {
                      const allowed = group.allowed_days.includes(day);
                      return /* @__PURE__ */ jsx("span", {
                        className: `day-chip ${allowed ? "day-chip-active" : "day-chip-inactive"}`,
                        children: day.slice(0, 1)
                      }, day);
                    })
                  })]
                }), isPostedToday && /* @__PURE__ */ jsxs("div", {
                  className: "posted-status-badge",
                  children: [/* @__PURE__ */ jsx(Check, {
                    size: 14
                  }), /* @__PURE__ */ jsxs("span", {
                    children: ["Posted today by ", posterName, " at ", postedTime]
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "group-actions-col",
                children: [isPostedToday ? /* @__PURE__ */ jsxs("button", {
                  onClick: () => handleUnmarkPosted(group.facebook_group_id),
                  className: "btn-undo-post",
                  title: "Undo today's post record",
                  children: [/* @__PURE__ */ jsx(Undo, {
                    size: 14
                  }), /* @__PURE__ */ jsx("span", {
                    children: "Undo"
                  })]
                }) : /* @__PURE__ */ jsxs("button", {
                  onClick: () => handleMarkPosted(group.facebook_group_id),
                  className: "btn-mark-posted",
                  title: "Mark this group as posted for today",
                  children: [/* @__PURE__ */ jsx(Check, {
                    size: 16
                  }), /* @__PURE__ */ jsx("span", {
                    children: "Mark Posted"
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "group-manage-btns",
                  children: [/* @__PURE__ */ jsx("button", {
                    onClick: () => handleOpenEditGroupModal(group),
                    className: "btn-icon",
                    title: "Edit group",
                    children: /* @__PURE__ */ jsx(Edit3, {
                      size: 14
                    })
                  }), /* @__PURE__ */ jsx("button", {
                    onClick: () => handleDeleteGroup(group.facebook_group_id, group.name),
                    className: "btn-icon btn-danger-soft",
                    title: "Delete group",
                    children: /* @__PURE__ */ jsx(Trash2, {
                      size: 14
                    })
                  })]
                })]
              })]
            }, group.facebook_group_id);
          })
        })
      })]
    }), isGroupModalOpen && /* @__PURE__ */ jsx("div", {
      className: "modal-backdrop",
      onClick: () => setIsGroupModalOpen(false),
      children: /* @__PURE__ */ jsxs("div", {
        className: "modal-content modal-md",
        onClick: (e) => e.stopPropagation(),
        children: [/* @__PURE__ */ jsxs("div", {
          className: "modal-header",
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px"
            },
            children: [/* @__PURE__ */ jsx(Sparkles, {
              size: 22,
              className: "text-accent"
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h2", {
                className: "modal-title",
                children: editingGroup ? "Edit Facebook Group" : "Add Facebook Group"
              }), /* @__PURE__ */ jsxs("p", {
                className: "modal-subtitle",
                children: ["Team: ", team.name]
              })]
            })]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setIsGroupModalOpen(false),
            className: "btn-close",
            children: /* @__PURE__ */ jsx(X, {
              size: 20
            })
          })]
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleSaveGroup,
          children: [/* @__PURE__ */ jsxs("div", {
            className: "modal-body",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Group Name *"
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                required: true,
                placeholder: "e.g. Local Community Events & Fairs",
                value: formName,
                onChange: (e) => setFormName(e.target.value),
                className: "input-field",
                autoFocus: true
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Facebook Group URL (Optional)"
              }), /* @__PURE__ */ jsx("input", {
                type: "url",
                placeholder: "https://facebook.com/groups/...",
                value: formUrl,
                onChange: (e) => setFormUrl(e.target.value),
                className: "input-field"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Posting Rules / Notes (Optional)"
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                placeholder: "e.g. Only post in weekly admin promo thread",
                value: formNotes,
                onChange: (e) => setFormNotes(e.target.value),
                className: "input-field"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "form-group",
              children: [/* @__PURE__ */ jsx("label", {
                className: "form-label",
                children: "Allowed Posting Days"
              }), /* @__PURE__ */ jsx("div", {
                className: "days-checkbox-grid",
                children: DAYS_OF_WEEK.map((day) => /* @__PURE__ */ jsxs("label", {
                  className: "day-checkbox-label",
                  children: [/* @__PURE__ */ jsx("input", {
                    type: "checkbox",
                    checked: formDays[day],
                    onChange: (e) => setFormDays((prev) => ({
                      ...prev,
                      [day]: e.target.checked
                    }))
                  }), /* @__PURE__ */ jsx("span", {
                    children: day
                  })]
                }, day))
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "modal-footer",
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => setIsGroupModalOpen(false),
              className: "btn-secondary",
              children: "Cancel"
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              disabled: isSavingGroup || !formName.trim(),
              className: "btn-primary",
              children: isSavingGroup ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Loader2, {
                  size: 16,
                  className: "spin"
                }), /* @__PURE__ */ jsx("span", {
                  children: "Saving..."
                })]
              }) : /* @__PURE__ */ jsx("span", {
                children: editingGroup ? "Update Group" : "Add Group"
              })
            })]
          })]
        })]
      })
    }), isMembersModalOpen && /* @__PURE__ */ jsx(TeamMembersModal, {
      teamId: team.team_id,
      teamName: team.name,
      currentUserRole: team.user_role || "member",
      isOpen: true,
      onClose: () => setIsMembersModalOpen(false)
    }), historyDrawerGroup && /* @__PURE__ */ jsx(PostHistoryDrawer, {
      group: historyDrawerGroup,
      isOpen: true,
      onClose: () => setHistoryDrawerGroup(null),
      onPostDeleted: () => loadDashboardData()
    })]
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: teams_$teamId
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BuSLrSvO.js", "imports": ["/assets/jsx-runtime-vvAXTV-B.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-D8RW50ww.js", "imports": ["/assets/jsx-runtime-vvAXTV-B.js", "/assets/AuthContext-Rw_C1hyx.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/_index-BLiffY3G.js", "imports": ["/assets/jsx-runtime-vvAXTV-B.js", "/assets/AuthContext-Rw_C1hyx.js", "/assets/loader-circle-Du0obITL.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/login-Cbr-fAWt.js", "imports": ["/assets/jsx-runtime-vvAXTV-B.js", "/assets/AuthContext-Rw_C1hyx.js", "/assets/loader-circle-Du0obITL.js", "/assets/sparkles-qcpZmFyv.js", "/assets/arrow-right-Bx0KflTz.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/teams": { "id": "routes/teams", "parentId": "root", "path": "teams", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/teams-DNMz9d5d.js", "imports": ["/assets/jsx-runtime-vvAXTV-B.js", "/assets/AuthContext-Rw_C1hyx.js", "/assets/TeamMembersModal-C-ZCwWL7.js", "/assets/loader-circle-Du0obITL.js", "/assets/sparkles-qcpZmFyv.js", "/assets/arrow-right-Bx0KflTz.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/teams.$teamId": { "id": "routes/teams.$teamId", "parentId": "root", "path": "teams/:teamId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/teams._teamId-D0LzpSN1.js", "imports": ["/assets/jsx-runtime-vvAXTV-B.js", "/assets/AuthContext-Rw_C1hyx.js", "/assets/TeamMembersModal-C-ZCwWL7.js", "/assets/loader-circle-Du0obITL.js", "/assets/sparkles-qcpZmFyv.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-bf0fa2cf.js", "version": "bf0fa2cf", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "v8_passThroughRequests": false, "v8_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = ["/"];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/teams": {
    id: "routes/teams",
    parentId: "root",
    path: "teams",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/teams.$teamId": {
    id: "routes/teams.$teamId",
    parentId: "root",
    path: "teams/:teamId",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
