import org.jetbrains.kotlin.gradle.utils.API
import java.util.Properties
import java.io.FileInputStream
import java.util.Base64
import java.nio.charset.StandardCharsets

plugins {
    id("com.android.application")
    id("kotlin-android")
    // For Firebase.
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localPropertiesFile.reader(StandardCharsets.UTF_8).use { reader ->
        localProperties.load(reader)
    }
}

// KeyStore for release builds
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {

    // TODO: set your applicationId and flavor settings
    flavorDimensions += "flavor"
    productFlavors {
        create("dev") {
            dimension = "flavor"
            applicationId = "com.memorylovers.myapp.dev"
            versionNameSuffix = "-dev"
            resValue("string", "admob_app_id", "ca-app-pub-3940256099942544~3347511713")
        }
        create("stag") {
            dimension = "flavor"
            applicationId = "com.memorylovers.myapp.stag"
            versionNameSuffix = "-stag"
            resValue("string", "admob_app_id", "ca-app-pub-3940256099942544~3347511713")
        }
        create("prod") {
            dimension = "flavor"
            applicationId = "com.memorylovers.myapp"
            versionNameSuffix = ""
            // TODO: set your admob_app_id
            resValue("string", "admob_app_id", "")
        }
    }
    
    namespace = "com.memorylovers.myapp"
    compileSdk = flutter.compileSdkVersion
    // Using flutter.ndkVersion will display a warning during the build process.
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
        // for flutter_local_notifications
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        minSdk = 23 // from flutter.minSdkVersion, for Firebase
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    // [アプリに署名  |  Android Studio  |  Android Developers](https://developer.android.com/studio/publish/app-signing?hl=ja)
    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = keystoreProperties["storeFile"]?.let { file(it) }
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = true
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    // Import the Firebase BoM
    implementation(platform("com.google.firebase:firebase-bom:33.3.0"))

    // Firebase libraries
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-crashlytics")
    // Add desugaring support for flutter_local_notifications
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
} 