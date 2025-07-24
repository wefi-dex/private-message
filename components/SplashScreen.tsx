import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const statusMessages = [
  'Loading critical vibe modules...',
  'Reticulating splines...',
  'Warming up sarcasm engine...',
  'Summoning creative energy ⚡',
  'Avoiding bugs... mostly.',
  'Running coolness protocols 😎',
  'Please hold while we reinvent the web...',
  'Decrypting the Matrix...',
  'Still better than your ex’s app 👀',
];

export default function SplashScreen() {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const [statusIdx, setStatusIdx] = useState(0);

  // useEffect(() => {
  //   Animated.loop(
  //     Animated.timing(spinAnim, {
  //       toValue: 1,
  //       duration: 1200,
  //       easing: Easing.linear,
  //       useNativeDriver: true,
  //     })
  //   ).start();

  //   Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(flickerAnim, {
  //         toValue: 0.4,
  //         duration: 500,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(flickerAnim, {
  //         toValue: 1,
  //         duration: 500,
  //         useNativeDriver: true,
  //       }),
  //     ])
  //   ).start();
  // }, []);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setStatusIdx((i) => (i + 1) % statusMessages.length);
  //   }, 2000);
  //   return () => clearInterval(interval);
  // }, []);

  // const spin = spinAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0deg', '360deg'],
  // });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        {/* <Animated.View
          style={[
            styles.circleLoader,
            {
              transform: [{ rotate: spin }],
              shadowColor: '#00ffc8',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 15,
              elevation: 10,
            },
          ]}
        /> */}
        {/* <Animated.Text style={[styles.loadingText, { opacity: flickerAnim }]}>Booting Awesomeness...</Animated.Text> */}
        <Text style={styles.statusLine}>{"statusMessages[statusIdx]"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderWrapper: {
    alignItems: 'center',
  },
  circleLoader: {
    borderWidth: 6,
    borderColor: '#333',
    borderTopColor: '#00ffc8',
    borderRadius: 40,
    width: 80,
    height: 80,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 20,
    color: '#ccc',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statusLine: {
    marginTop: 15,
    fontSize: 15,
    color: '#777',
    opacity: 0.9,
    textAlign: 'center',
  },
}); 