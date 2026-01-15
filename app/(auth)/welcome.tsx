import { Platform, Text, View, StyleSheet, TextInput, TouchableOpacity, Pressable } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, ImageBackground } from 'expo-image';
import tw from "twrnc";
import { Input } from '@rneui/themed';
import { Formik } from "formik";
import * as Yup from "yup";
import { Redirect, Link } from "expo-router";
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlaceholderImage = require('@/assets/images/medkit_by_fortnite.png');

const validation = Yup.object().shape({
    email: Yup.string().required('Email Required').email().label("Email"),
    password: Yup.string().required('Password Required').min(4).label("Password"),
})

const HomeScreen = () => {
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/(tabs)/explore');
      }
    } catch (error) {
      alert(error.message);
      console.log(error, values);
    }
  };

  return (
    
    <ImageBackground source={require('@/assets/images/bg.png')} style={{width: '100%', height: '100%'}}>
    <SafeAreaView className="fslex-row flex">
    <View style={styles.header}>
        <Image source={require('@/assets/images/add.png')} style={styles.image}></Image>
        <Text style={styles.title}>Welcome!</Text>
    
        <Formik 
            initialValues={{ email: "", password: ""}}
            onSubmit={handleLogin}
            validationSchema={validation}
        >
        {({handleChange, handleBlur, handleSubmit, values, errors, touched})=>(
            <View style={styles.form}>
                <TextInput
                    style={[styles.input, errors.email && touched.email && {borderColor: 'red'}]}
                    placeholder={errors.email && touched.email ? "Email Required" : "Enter Email"}
                    placeholderTextColor= {errors.email && touched.email ? "red" : "#cbc7f4"}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    value={values.email}
                    keyboardType='email-address'
                />
                

                <TextInput
                    style={[styles.input, errors.password && touched.password && {borderColor: 'red'}]}
                    placeholder={errors.password && touched.password ? "Password Required" : "Enter Password"}
                    placeholderTextColor= {errors.password && touched.password ? "red" : "#cbc7f4"}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    value={values.password}
                    secureTextEntry={true}
                />
                

                {/* Login */}
                <TouchableOpacity onPress={handleSubmit}>
                    <View style={styles.button}>
                        <Text style={styles.buttonText}>
                            Login
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )}
        </Formik>
        <View style={styles.reg}>
            <Link style={styles.reg} href="/(auth)/register">Don't Have an Account?</Link>
        </View>
        <View style={styles.reg}>
            <Link style={styles.reg} href="/(tabs)/explore">route back</Link>
        </View>
    </View>
    </SafeAreaView>
    </ImageBackground>
  
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      backgroundColor: "#f5f5f5",
    },
    image: {
        alignItems: "center",
        alignContent: "center",
        width: "35%",
        marginTop: "10%",
        height: "24%",
    },
    reg: {
        marginTop: 5,
        alignItems: "center",
        alignContent: "center",
        color: "#c4bce9",
    },
    header: {
        alignItems: "center",
        alignContent: "center",
        
    },
    title: {
      fontSize: 32,
      color: "#c4bce9",
      fontWeight: "bold",
      marginTop: "20%",
      marginBottom: "10%",
      textAlign: "center",
    },
    form: {
      width: "100%",
      alignContent: "center",
      alignItems: "center"
    },
    input: {
      height: 50,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "70%"
    },
    errorText: {
      color: "red",
      marginBottom: 8,
      marginTop: 0,
      fontStyle: "italic"
    },
    button: {
      height: 50,
      backgroundColor: "#cbc7f4",
      borderColor: "#ccc",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
      marginTop: 16,
      
      width: 150
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
  });