import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

import Login from '../screens/Login';
import Register from '../screens/Register';
import Feed from '../screens/Feed';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  ListingDetail: { listingId: string };
  OrderConfirmation: { listingId: string };
  BuyerOrderStatus: { orderId: string };
  OrderActions: { orderId: string };
  CreateListing: undefined;
  EditListing: { listingId: string };
  SellerDashboard: undefined;
  SellerOrderList: undefined;
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  Feed: undefined;
  Sell: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Feed" component={Feed} options={{ title: 'Browse' }} />
    </Tab.Navigator>
  );
}

export default function Navigation(): React.JSX.Element {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
