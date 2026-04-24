import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getProfile } from "@/api/supabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Bell, PawPrint, LogOut, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, updateMe, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    location: "",
    climate: "temperate",
    pet_safety_mode: false,
    notifications_enabled: true,
    notification_time: "08:00",
  });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfile(user.id);
        if (profile?.location) setSettings((s) => ({ ...s, location: profile.location }));
        if (profile?.climate) setSettings((s) => ({ ...s, climate: profile.climate }));
        if (profile?.pet_safety_mode !== undefined)
          setSettings((s) => ({ ...s, pet_safety_mode: profile.pet_safety_mode }));
        if (profile?.notifications_enabled !== undefined)
          setSettings((s) => ({ ...s, notifications_enabled: profile.notifications_enabled }));
        if (profile?.notification_time)
          setSettings((s) => ({ ...s, notification_time: profile.notification_time }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    await updateMe(settings);
    toast.success("Settings saved!");
    setSaving(false);
  };

  const handleLogout = () => {
    logout(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="mb-8">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{user?.full_name || user?.email || "Plant Lover"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Location & Climate</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              placeholder="e.g. New York, US"
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Climate Zone</Label>
            <Select
              value={settings.climate}
              onValueChange={(val) => setSettings({ ...settings, climate: val })}
            >
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tropical">Tropical</SelectItem>
                <SelectItem value="subtropical">Subtropical</SelectItem>
                <SelectItem value="temperate">Temperate</SelectItem>
                <SelectItem value="continental">Continental</SelectItem>
                <SelectItem value="arid">Arid / Dry</SelectItem>
                <SelectItem value="mediterranean">Mediterranean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
            <div>
              <p className="text-sm font-medium">Care Reminders</p>
              <p className="text-xs text-muted-foreground">Get notified about tasks</p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(val) =>
                setSettings({ ...settings, notifications_enabled: val })
              }
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <PawPrint className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Pet Safety</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
          <div>
            <p className="text-sm font-medium">Pet Safety Mode</p>
            <p className="text-xs text-muted-foreground">Highlight toxic plants</p>
          </div>
          <Switch
            checked={settings.pet_safety_mode}
            onCheckedChange={(val) =>
              setSettings({ ...settings, pet_safety_mode: val })
            }
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mb-4"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Settings
      </Button>

      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full h-12 rounded-2xl font-semibold"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}
