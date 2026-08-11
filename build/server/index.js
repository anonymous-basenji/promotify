import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Share2, RotateCcw, Plus, Calendar, Sparkles, Copy, Search, AlertCircle, Edit3, Clock, Undo, ExternalLink, X, Trash2 } from "lucide-react";
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
const stylesheet = "/assets/app-DCodUa44.css";
const meta = () => {
  return [{
    title: "Promotify - Facebook Group Promotion Planner"
  }, {
    name: "description",
    content: "Track which Facebook groups allow promo posts on any day of the week."
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
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
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
const DEFAULT_PROMO_TEXT = `🚀 Check out our latest products and services! 
We offer top-rated solutions with special community discounts.

👉 Visit our website or DM us for more details!
#CentralFlorida #LocalBusiness #Promotion`;
const INITIAL_GROUPS = [
  {
    id: "grp-1",
    name: "You live in Debary if…",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-2",
    name: "Winter Garden Community",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "One post every 7 days max"
  },
  {
    id: "grp-3",
    name: "Orlando Foodie Forum",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "One post every 7 days max"
  },
  {
    id: "grp-4",
    name: "Community of Kissimmee",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: true, Saturday: false },
    notes: ""
  },
  {
    id: "grp-5",
    name: "Clermont Word of Mouth",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-6",
    name: "Orlando, FL Community Information",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-7",
    name: "Russian Speaking Central Florida",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-8",
    name: "БОЛЬШОЙ ОРЛАНДО - Русскоязычная Группа!",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "One post per month"
  },
  {
    id: "grp-9",
    name: "Debary Proud",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "No posting rules available - assume allowed anytime"
  },
  {
    id: "grp-10",
    name: "Altamonte Springs - Rants, Raves, Reviews and News",
    days: { Sunday: true, Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-11",
    name: "Русскоговорящая община Флориды *** Russian-speaking community of Florida",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "MUST ASK ADMIN PERMISSION BEFORE POSTING"
  },
  {
    id: "grp-12",
    name: "Очень Большой ОРЛАНДО, ФЛОРИДА США",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "May possibly only be allowed on Mondays, but unlikely"
  },
  {
    id: "grp-13",
    name: "Ukrainian Orlando / Українське Орландо",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-14",
    name: "Объявления Тампа Орландо Сарасота",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-15",
    name: "Deltona - Everything you need to know",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: true, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-16",
    name: "Русскоговорящие в Орландо",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-17",
    name: "DeBary Proud! The one and only.",
    days: { Sunday: false, Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-18",
    name: "Oviedo, Florida 32765 32766",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "Max every 72 hours"
  },
  {
    id: "grp-19",
    name: "Sanford 32771/32773",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-20",
    name: "Longwood & Altamonte Springs FL",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "Max twice a week"
  },
  {
    id: "grp-21",
    name: "Lake Mary/Heathrow/Longwood/Sanford Business Connection",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-22",
    name: "Sanford 327 say what you want !! No Admin censoring !",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-23",
    name: "Winter Springs/Oviedo, Florida Community Page 32765, 32708",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-24",
    name: "Orange City Proud",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: true, Saturday: false },
    notes: ""
  },
  {
    id: "grp-25",
    name: "Osteen, Florida",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-26",
    name: "Русские в Орландо. Russian Orlando",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: "Requires admin permission to post"
  },
  {
    id: "grp-27",
    name: "Deltona - The Place We Call Home",
    days: { Sunday: false, Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: true, Saturday: false },
    notes: ""
  },
  {
    id: "grp-28",
    name: "Geneva, FL",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-29",
    name: "Ukranian Diaspora in Florida!!!",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-30",
    name: "Happenings In Seminole County, FL",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-31",
    name: "Orlando Business Connect",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-32",
    name: "Orlando Entrepreneurs Network",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-33",
    name: "Leading Events - Vendors, Crafters & Artisans In Central FL",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-34",
    name: "Our Winter Springs",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: true, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-35",
    name: "Vendor Events in Polk County, FL",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-36",
    name: "Chuluota, Florida 32766",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-37",
    name: "Casselberry 32707",
    days: { Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true },
    notes: ""
  },
  {
    id: "grp-38",
    name: "Oviedo, FL Community 32765 & 32766",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  },
  {
    id: "grp-39",
    name: "РУССКОЯЗЫЧНАЯ ОБЩИНА во ФЛОРИДЕ (РОФ)",
    days: { Sunday: false, Monday: true, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false },
    notes: ""
  }
];
const GROUPS_STORAGE_KEY = "promotify_groups_v1";
const PROMO_TEXT_STORAGE_KEY = "promotify_promo_text_v1";
function usePromotifyData() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [promoText, setPromoText] = useState(DEFAULT_PROMO_TEXT);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      } else {
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(INITIAL_GROUPS));
      }
      const savedPromoText = localStorage.getItem(PROMO_TEXT_STORAGE_KEY);
      if (savedPromoText) {
        setPromoText(savedPromoText);
      } else {
        localStorage.setItem(PROMO_TEXT_STORAGE_KEY, DEFAULT_PROMO_TEXT);
      }
    } catch (e) {
      console.warn("LocalStorage error, fallback to memory state:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);
  const saveGroups = useCallback((newGroups) => {
    setGroups(newGroups);
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(newGroups));
    } catch (e) {
      console.error("Failed to save groups:", e);
    }
  }, []);
  const savePromoText = useCallback((text) => {
    setPromoText(text);
    try {
      localStorage.setItem(PROMO_TEXT_STORAGE_KEY, text);
    } catch (e) {
      console.error("Failed to save promo text:", e);
    }
  }, []);
  const addGroup = useCallback((group) => {
    const newId = `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newGroup = { ...group, id: newId };
    saveGroups([newGroup, ...groups]);
  }, [groups, saveGroups]);
  const updateGroup = useCallback((updatedGroup) => {
    const updatedList = groups.map((g) => g.id === updatedGroup.id ? updatedGroup : g);
    saveGroups(updatedList);
  }, [groups, saveGroups]);
  const deleteGroup = useCallback((id) => {
    const updatedList = groups.filter((g) => g.id !== id);
    saveGroups(updatedList);
  }, [groups, saveGroups]);
  const toggleGroupDay = useCallback((groupId, day) => {
    const updatedList = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          days: {
            ...g.days,
            [day]: !g.days[day]
          }
        };
      }
      return g;
    });
    saveGroups(updatedList);
  }, [groups, saveGroups]);
  const markGroupPosted = useCallback((groupId) => {
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const updatedList = groups.map((g) => {
      if (g.id === groupId) {
        return { ...g, lastPostedDate: todayStr };
      }
      return g;
    });
    saveGroups(updatedList);
  }, [groups, saveGroups]);
  const unmarkGroupPosted = useCallback((groupId) => {
    const updatedList = groups.map((g) => {
      if (g.id === groupId) {
        const updated = { ...g };
        delete updated.lastPostedDate;
        return updated;
      }
      return g;
    });
    saveGroups(updatedList);
  }, [groups, saveGroups]);
  const resetToDefault = useCallback(() => {
    saveGroups(INITIAL_GROUPS);
    savePromoText(DEFAULT_PROMO_TEXT);
  }, [saveGroups, savePromoText]);
  return {
    groups,
    promoText,
    isLoaded,
    savePromoText,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroupDay,
    markGroupPosted,
    unmarkGroupPosted,
    resetToDefault
  };
}
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
const _index = UNSAFE_withComponentProps(function Index() {
  const {
    groups,
    promoText,
    isLoaded,
    savePromoText,
    addGroup,
    updateGroup,
    deleteGroup,
    markGroupPosted,
    unmarkGroupPosted,
    resetToDefault
  } = usePromotifyData();
  const todayDayName = useMemo(() => {
    const dayIndex = (/* @__PURE__ */ new Date()).getDay();
    return DAYS_OF_WEEK[dayIndex];
  }, []);
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
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
  const activeDayName = selectedFilter === "today" ? todayDayName : selectedFilter === "all" ? todayDayName : selectedFilter;
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };
  const handleCopyPromoText = () => {
    if (!promoText) return;
    navigator.clipboard.writeText(promoText);
    triggerToast("Promo text copied to clipboard! 📋");
  };
  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setFormName("");
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
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (group) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormNotes(group.notes || "");
    setFormDays({
      ...group.days
    });
    setIsModalOpen(true);
  };
  const handleSaveGroup = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (editingGroup) {
      updateGroup({
        ...editingGroup,
        name: formName.trim(),
        notes: formNotes.trim(),
        days: formDays
      });
      triggerToast("Group schedule updated! ✨");
    } else {
      addGroup({
        name: formName.trim(),
        notes: formNotes.trim(),
        days: formDays
      });
      triggerToast("New group added! 🎉");
    }
    setIsModalOpen(false);
  };
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      var _a;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(query);
        const matchNotes = ((_a = g.notes) == null ? void 0 : _a.toLowerCase().includes(query)) || false;
        if (!matchName && !matchNotes) return false;
      }
      if (selectedFilter === "all") return true;
      const dayToCheck = selectedFilter === "today" ? todayDayName : selectedFilter;
      return g.days[dayToCheck];
    }).sort((a, b) => {
      const aHasNotes = a.notes ? 1 : 0;
      const bHasNotes = b.notes ? 1 : 0;
      if (bHasNotes !== aHasNotes) return bHasNotes - aHasNotes;
      const aDaysCount = Object.values(a.days).filter(Boolean).length;
      const bDaysCount = Object.values(b.days).filter(Boolean).length;
      return aDaysCount - bDaysCount;
    });
  }, [groups, searchQuery, selectedFilter, todayDayName]);
  useMemo(() => {
    const checkDay = selectedFilter === "today" ? todayDayName : selectedFilter === "all" ? todayDayName : selectedFilter;
    return groups.filter((g) => g.days[checkDay]).length;
  }, [groups, selectedFilter, todayDayName]);
  if (!isLoaded) {
    return /* @__PURE__ */ jsx("div", {
      className: "app-container",
      style: {
        justifyContent: "center",
        alignItems: "center"
      },
      children: /* @__PURE__ */ jsx("p", {
        style: {
          color: "var(--text-secondary)"
        },
        children: "Loading Promotify..."
      })
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "app-container",
    children: [toastMessage && /* @__PURE__ */ jsxs("div", {
      className: "toast",
      children: [/* @__PURE__ */ jsx(Check, {
        size: 18
      }), /* @__PURE__ */ jsx("span", {
        children: toastMessage
      })]
    }), /* @__PURE__ */ jsxs("header", {
      className: "header-bar",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "brand",
        children: [/* @__PURE__ */ jsx("div", {
          className: "brand-icon",
          children: /* @__PURE__ */ jsx(Share2, {
            size: 24
          })
        }), /* @__PURE__ */ jsx("div", {
          children: /* @__PURE__ */ jsx("h1", {
            className: "brand-title",
            children: "Promotify"
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "header-actions",
        children: [/* @__PURE__ */ jsx("button", {
          className: "btn-icon",
          title: "Reset to Original CSV Schedule",
          onClick: () => {
            if (confirm("Reset all groups and promo text back to default seed CSV schedule?")) {
              resetToDefault();
              triggerToast("Schedule reset to default CSV! 🔄");
            }
          },
          children: /* @__PURE__ */ jsx(RotateCcw, {
            size: 18
          })
        }), /* @__PURE__ */ jsxs("button", {
          className: "btn-primary",
          onClick: handleOpenAddModal,
          children: [/* @__PURE__ */ jsx(Plus, {
            size: 18
          }), /* @__PURE__ */ jsx("span", {
            children: "Add Group"
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs("section", {
      className: "stats-banner",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "stats-info",
        children: [/* @__PURE__ */ jsxs("h2", {
          children: [/* @__PURE__ */ jsx(Calendar, {
            size: 20,
            style: {
              color: "var(--accent-primary)"
            }
          }), selectedFilter === "today" ? `Today is ${todayDayName}` : selectedFilter === "all" ? "All Facebook Groups" : `${selectedFilter} Schedule`]
        }), /* @__PURE__ */ jsx("p", {
          children: selectedFilter === "all" ? `Showing total ${groups.length} Facebook groups in dataset` : `Showing ${filteredGroups.length} groups open for posting on ${activeDayName}`
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "stats-badge",
        children: [filteredGroups.length, " Groups"]
      })]
    }), /* @__PURE__ */ jsxs("section", {
      className: "promo-card",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "promo-header",
        children: [/* @__PURE__ */ jsxs("h2", {
          className: "promo-title",
          children: [/* @__PURE__ */ jsx(Sparkles, {
            size: 18,
            style: {
              color: "var(--accent-amber)"
            }
          }), "Saved Promotion Post Text"]
        }), /* @__PURE__ */ jsxs("span", {
          className: "char-count",
          children: [promoText.length, " characters"]
        })]
      }), /* @__PURE__ */ jsx("textarea", {
        className: "promo-textarea",
        value: promoText,
        onChange: (e) => savePromoText(e.target.value),
        placeholder: "Paste or write your promotional post text here..."
      }), /* @__PURE__ */ jsxs("div", {
        className: "promo-footer",
        children: [/* @__PURE__ */ jsx("span", {
          className: "char-count",
          style: {
            fontSize: "0.775rem"
          },
          children: "Auto-saved to device"
        }), /* @__PURE__ */ jsxs("button", {
          className: "btn-primary",
          onClick: handleCopyPromoText,
          children: [/* @__PURE__ */ jsx(Copy, {
            size: 16
          }), /* @__PURE__ */ jsx("span", {
            children: "Copy Post Text"
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs("nav", {
      className: "day-selector-container",
      children: [/* @__PURE__ */ jsxs("button", {
        className: `day-tab ${selectedFilter === "today" ? "active" : ""}`,
        onClick: () => setSelectedFilter("today"),
        children: [/* @__PURE__ */ jsx("span", {
          className: "today-dot"
        }), "Today (", todayDayName.slice(0, 3), ")"]
      }), DAYS_OF_WEEK.map((day) => /* @__PURE__ */ jsx("button", {
        className: `day-tab ${selectedFilter === day ? "active" : ""}`,
        onClick: () => setSelectedFilter(day),
        children: day
      }, day)), /* @__PURE__ */ jsxs("button", {
        className: `day-tab ${selectedFilter === "all" ? "active" : ""}`,
        onClick: () => setSelectedFilter("all"),
        children: ["All Groups (", groups.length, ")"]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "search-container",
      children: [/* @__PURE__ */ jsx(Search, {
        size: 18,
        className: "search-icon"
      }), /* @__PURE__ */ jsx("input", {
        type: "text",
        className: "search-input",
        placeholder: "Search Facebook groups by name or rule...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value)
      })]
    }), filteredGroups.length === 0 ? /* @__PURE__ */ jsxs("div", {
      style: {
        textAlign: "center",
        padding: "40px 20px",
        color: "var(--text-muted)"
      },
      children: [/* @__PURE__ */ jsx(AlertCircle, {
        size: 40,
        style: {
          marginBottom: "12px",
          opacity: 0.5
        }
      }), /* @__PURE__ */ jsxs("p", {
        children: ["No Facebook groups match your filter for ", selectedFilter === "today" ? todayDayName : selectedFilter, "."]
      })]
    }) : /* @__PURE__ */ jsx("main", {
      className: "groups-grid",
      children: filteredGroups.map((group) => {
        group.days[todayDayName];
        const isAllowedActiveDay = group.days[activeDayName];
        return /* @__PURE__ */ jsxs("article", {
          className: `group-card ${!isAllowedActiveDay ? "inactive-today" : ""}`,
          children: [/* @__PURE__ */ jsxs("div", {
            className: "group-card-header",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "group-name",
              children: group.name
            }), /* @__PURE__ */ jsx("button", {
              className: "btn-icon",
              style: {
                padding: "6px"
              },
              onClick: () => handleOpenEditModal(group),
              title: "Edit group schedule",
              children: /* @__PURE__ */ jsx(Edit3, {
                size: 14
              })
            })]
          }), group.notes && /* @__PURE__ */ jsxs("div", {
            className: "group-notes",
            children: [/* @__PURE__ */ jsx(Clock, {
              size: 13
            }), /* @__PURE__ */ jsx("span", {
              children: group.notes
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "days-chips",
            children: DAYS_OF_WEEK.map((d) => {
              const isDayActive = group.days[d];
              return /* @__PURE__ */ jsx("span", {
                className: `day-chip ${isDayActive ? "active" : ""}`,
                title: `${d}: ${isDayActive ? "Allowed" : "Not Allowed"}`,
                children: d[0]
              }, d);
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "card-actions",
            children: [group.lastPostedDate ? /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "8px"
              },
              children: [/* @__PURE__ */ jsxs("span", {
                className: "posted-tag",
                children: [/* @__PURE__ */ jsx(Check, {
                  size: 12
                }), " Posted ", group.lastPostedDate]
              }), /* @__PURE__ */ jsxs("button", {
                className: "btn-small-action",
                style: {
                  color: "var(--accent-amber)",
                  borderColor: "rgba(245, 158, 11, 0.3)"
                },
                onClick: () => {
                  unmarkGroupPosted(group.id);
                  triggerToast(`Untracked post for "${group.name}" ↩️`);
                },
                title: "Untrack post date",
                children: [/* @__PURE__ */ jsx(Undo, {
                  size: 12
                }), /* @__PURE__ */ jsx("span", {
                  children: "Untrack"
                })]
              })]
            }) : /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: "0.75rem",
                color: isAllowedActiveDay ? "var(--accent-emerald)" : "var(--text-muted)"
              },
              children: isAllowedActiveDay ? `Open on ${activeDayName}` : `Closed on ${activeDayName}`
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: "6px"
              },
              children: [/* @__PURE__ */ jsxs("button", {
                className: "btn-small-action",
                onClick: () => {
                  handleCopyPromoText();
                  markGroupPosted(group.id);
                  triggerToast(`Copied & tracked post for "${group.name}"! 📌`);
                },
                title: "Copy text & mark group as posted today",
                children: [/* @__PURE__ */ jsx(Copy, {
                  size: 13
                }), /* @__PURE__ */ jsx("span", {
                  children: group.lastPostedDate ? "Re-copy Text" : "Copy & Track"
                })]
              }), /* @__PURE__ */ jsx("a", {
                href: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(group.name)}`,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "btn-small-action",
                title: "Open Facebook group search",
                children: /* @__PURE__ */ jsx(ExternalLink, {
                  size: 13
                })
              })]
            })]
          })]
        }, group.id);
      })
    }), isModalOpen && /* @__PURE__ */ jsx("div", {
      className: "modal-overlay",
      onClick: () => setIsModalOpen(false),
      children: /* @__PURE__ */ jsxs("div", {
        className: "modal-content",
        onClick: (e) => e.stopPropagation(),
        children: [/* @__PURE__ */ jsxs("div", {
          className: "modal-header",
          children: [/* @__PURE__ */ jsx("h3", {
            children: editingGroup ? "Edit Facebook Group" : "Add Facebook Group"
          }), /* @__PURE__ */ jsx("button", {
            className: "btn-icon",
            onClick: () => setIsModalOpen(false),
            children: /* @__PURE__ */ jsx(X, {
              size: 18
            })
          })]
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleSaveGroup,
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            className: "form-group",
            children: [/* @__PURE__ */ jsx("label", {
              className: "form-label",
              children: "Group Name"
            }), /* @__PURE__ */ jsx("input", {
              type: "text",
              className: "form-input",
              placeholder: "e.g. Orlando Business Connect",
              value: formName,
              onChange: (e) => setFormName(e.target.value),
              required: true
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-group",
            children: [/* @__PURE__ */ jsx("label", {
              className: "form-label",
              children: "Posting Notes / Frequency Rules"
            }), /* @__PURE__ */ jsx("input", {
              type: "text",
              className: "form-input",
              placeholder: "e.g. One post every 7 days max",
              value: formNotes,
              onChange: (e) => setFormNotes(e.target.value)
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-group",
            children: [/* @__PURE__ */ jsx("label", {
              className: "form-label",
              children: "Allowed Days of Week"
            }), /* @__PURE__ */ jsx("div", {
              className: "days-picker",
              children: DAYS_OF_WEEK.map((d) => /* @__PURE__ */ jsxs("div", {
                className: `day-checkbox-item ${formDays[d] ? "checked" : ""}`,
                onClick: () => setFormDays((prev) => ({
                  ...prev,
                  [d]: !prev[d]
                })),
                children: [/* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  checked: formDays[d],
                  onChange: () => {
                  },
                  style: {
                    pointerEvents: "none"
                  }
                }), /* @__PURE__ */ jsx("span", {
                  children: d
                })]
              }, d))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px"
            },
            children: [editingGroup ? /* @__PURE__ */ jsxs("button", {
              type: "button",
              style: {
                background: "transparent",
                border: "none",
                color: "var(--accent-rose)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.85rem"
              },
              onClick: () => {
                if (confirm(`Delete group "${editingGroup.name}"?`)) {
                  deleteGroup(editingGroup.id);
                  setIsModalOpen(false);
                  triggerToast("Group deleted! 🗑️");
                }
              },
              children: [/* @__PURE__ */ jsx(Trash2, {
                size: 15
              }), " Delete Group"]
            }) : /* @__PURE__ */ jsx("div", {}), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: "8px"
              },
              children: [/* @__PURE__ */ jsx("button", {
                type: "button",
                className: "btn-secondary",
                onClick: () => setIsModalOpen(false),
                children: "Cancel"
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                className: "btn-primary",
                children: "Save Group"
              })]
            })]
          })]
        })]
      })
    })]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _index
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-215MQuG3.js", "imports": ["/assets/jsx-runtime-psaW7uDY.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-CIPfsi_a.js", "imports": ["/assets/jsx-runtime-psaW7uDY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/_index-CRGdAMO0.js", "imports": ["/assets/jsx-runtime-psaW7uDY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-f180f35d.js", "version": "f180f35d", "sri": void 0 };
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
