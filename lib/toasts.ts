import { toast as sonnerToast } from "sonner";

export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    style: {
      background: "rgba(10,15,30,0.95)",
      border: "1px solid rgba(212,175,55,0.3)",
      color: "#e2e8f0",
    },
  });
}

export function toastError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
    style: {
      background: "rgba(10,15,30,0.95)",
      border: "1px solid rgba(220,38,38,0.4)",
      color: "#e2e8f0",
    },
  });
}

export function toastLoading(message: string) {
  return sonnerToast.loading(message, {
    style: {
      background: "rgba(10,15,30,0.95)",
      border: "1px solid rgba(212,175,55,0.2)",
      color: "#e2e8f0",
    },
  });
}

export function toastAchievement(title: string, description?: string) {
  sonnerToast(title, {
    description,
    icon: "🏆",
    style: {
      background: "rgba(10,15,30,0.95)",
      border: "1px solid rgba(212,175,55,0.5)",
      color: "#d4af37",
    },
  });
}

export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    style: {
      background: "rgba(10,15,30,0.95)",
      border: "1px solid rgba(148,163,184,0.3)",
      color: "#e2e8f0",
    },
  });
}

export function dismissToast(id: string | number) {
  sonnerToast.dismiss(id);
}
