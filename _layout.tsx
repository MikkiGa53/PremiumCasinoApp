import { Tabs } from "expo-router";
import React from "react";
import { CustomTabBar } from "@/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"       options={{ title: "Home"       }} />
      <Tabs.Screen name="coinflip"    options={{ title: "Coin Flip"  }} />
      <Tabs.Screen name="dice"        options={{ title: "Dice"       }} />
      <Tabs.Screen name="slots"       options={{ title: "Slots"      }} />
      <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard"}} />
      <Tabs.Screen name="profile"     options={{ title: "Profile"    }} />
    </Tabs>
  );
}
