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

const PlaceholderImage = require('@/assets/images/medkit_by_fortnite.png');

const validation = Yup.object().shape({
    email: Yup.string().required('Email Required').email().label("Email"),
    password: Yup.string().required('Password Required').min(6).label("Password"),
    confirmPassword: Yup.string().oneOf([Yup.ref("password")], "Passwords must match").required("Required"),
    firstName: Yup.string().required('First Name Required').label("First Name"),
    lastName: Yup.string().required('Last Name Required').label("Last Name"),
    username: Yup.string().required('Username Required').min(3).label("Username")
});

type RegisterFormValues = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    username: string;
};

const Register = () => {
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      // Update the profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          username: values.username,
        })
        .eq('id', authData.user!.id);

      if (profileError) throw profileError;

      alert('Registration successful! Please check your email for verification.');
      router.replace('/(auth)/welcome');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <ImageBackground source={require('@/assets/images/bg.png')} style={{width: '100%', height: '100%'}}>
      <SafeAreaView className="fslex-row flex">
        <View style={styles.header}>
          <Image source={require('@/assets/images/add.png')} style={styles.image}></Image>
          <Text style={styles.title}>Sign Up</Text>
      
          <Formik 
            initialValues={{
              email: "",
              password: "",
              confirmPassword: "",
              firstName: "",
              lastName: "",
              username: ""
            }}
            onSubmit={handleRegister}
            validationSchema={validation}
          >
            {({handleChange, handleBlur, handleSubmit, values, errors, touched})=>(
              <View style={styles.form}>
                <View style={styles.name}>
                <TextInput
                  style={[styles.input1, errors.firstName && touched.firstName && {borderColor: 'red'}]}
                  placeholder={errors.firstName && touched.firstName ? "First Name Required" : "First Name"}
                  placeholderTextColor= {errors.firstName && touched.firstName ? "red" : "#cbc7f4"}
                  onChangeText={handleChange("firstName")}
                  onBlur={handleBlur("firstName")}
                  value={values.firstName}
                />
             

                <TextInput
                  style={[styles.input2, errors.lastName && touched.lastName && {borderColor: 'red'}]}
                  placeholder={errors.lastName && touched.lastName ? "Last Name Required" : "Last Name"}
                  placeholderTextColor= {errors.lastName && touched.lastName ? "red" : "#cbc7f4"}
                  onChangeText={handleChange("lastName")}
                  onBlur={handleBlur("lastName")}
                  value={values.lastName}
                />
               
                </View>
                <TextInput
                  style={[styles.input3, errors.username && touched.username && {borderColor: 'red'}]}
                  placeholder={errors.username && touched.username ? "Username Required" : "Create Username"}
                  placeholderTextColor= {errors.username && touched.username ? "red" : "#cbc7f4"}
                  onChangeText={handleChange("username")}
                  onBlur={handleBlur("username")}
                  value={values.username}
                />
               

                <TextInput
                  style={[styles.input4, errors.email && touched.email && {borderColor: 'red'}]}
                  placeholder={errors.email && touched.email ? "Email Required" : "Enter Email"}
                  placeholderTextColor= {errors.email && touched.email ? "red" : "#cbc7f4"}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                  keyboardType='email-address'
                />
                {/* Error */}
               
                <TextInput
                  style={[styles.input5, errors.password && touched.password && {borderColor: 'red'}]}
                  placeholder={errors.password && touched.password ? "Must be at least 6 characters" : "Create Password"}
                  placeholderTextColor= {errors.password && touched.password ? "red" : "#cbc7f4"}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry={true}
                />

                {/* Error */}
                

                <TextInput
                  style={[styles.input6, errors.confirmPassword && touched.confirmPassword && {borderColor: 'red'}]}
                  placeholder={errors.confirmPassword && touched.confirmPassword ? "Passwords must match" : "Confirm Password"}
                  placeholderTextColor= {errors.confirmPassword && touched.confirmPassword ? "red" : "#cbc7f4"}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  secureTextEntry={true}
                />
                {/* Error */}

                {/* Login */}
                <TouchableOpacity onPress={handleSubmit}>
                  <View style={styles.button}>
                    <Text style={styles.buttonText}>
                      Register
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.reg}>
                    <Link style={styles.reg} href="/(auth)/welcome">Have an Account?</Link>
          </View>
              </View>
            )}
          </Formik>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

export default Register;

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
        width: "40%",
        marginTop: "10%",
        height: "22%",
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
      marginTop: "10%",
      marginBottom: "10%",
      textAlign: "center",
    },
    form: {
      width: "100%",
      alignContent: "center",
      alignItems: "center"
    },
    name: {
      flexDirection: "row",
      alignContent: "center",
      alignItems: "center",
    },
    input: {
      height: 40,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "70%"
    },
    input1: {
      height: 40,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "34%",
      marginRight: "1%"
    },
    input2: {
      height: 40,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "34%",
      marginLeft: "1%"
    },
    input3: {
      height: 40,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "70%"
    },
    input4: {
      height: 40,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "70%"
    },
    input5: {
      height: 40,
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "#ffffff",
      color: "#cbc7f4",
      width: "70%"
    },
    input6: {
      height: 40,
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
      fontStyle: "italic",
      flexDirection: "column"
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