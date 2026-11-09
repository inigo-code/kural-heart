import com.android.build.api.artifact.SingleArtifact

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.inigocode.kuralheart"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.inigocode.kuralheart"
        minSdk = 26
        targetSdk = 36
        versionCode = 10
        versionName = "0.10.0"
        // Self-updating from GitHub releases is for copies installed from the website; Play updates its own.
        buildConfigField("boolean", "SELF_UPDATE", "true")
        buildConfigField("String", "UPDATE_REPO", "\"inigo-code/kural-heart\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            buildConfigField("boolean", "SELF_UPDATE", "false")
        }
        // The release build, signed with this computer's Android debug key so it can be installed for testing.
        // Play builds are signed with the owner's own upload key, which never lives in this repository.
        create("preview") {
            initWith(getByName("release"))
            signingConfig = signingConfigs.getByName("debug")
            matchingFallbacks += listOf("release")
            buildConfigField("boolean", "SELF_UPDATE", "true")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.documentfile)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.fragment)
    implementation(libs.play.services.auth)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    testImplementation(libs.junit)
    // Android's org.json is a stub in JVM tests; the pack tests need the real parser.
    testImplementation(libs.org.json)
}

/*
 * The permission guard. Kural Heart goes online only for Drive sync, weather and update checks, all off until the
 * person turns them on. Every assemble checks the fully merged manifest against this list, so a library cannot add
 * a permission quietly, and the self-update permission can never reach the Play build.
 */
abstract class CheckPermissions : DefaultTask() {
    @get:InputFile
    abstract val mergedManifest: RegularFileProperty

    @get:Input
    abstract val allowed: ListProperty<String>

    @TaskAction
    fun check() {
        val text = mergedManifest.get().asFile.readText()
        val requested = Regex("""uses-permission[^>]*android:name="([^"]+)"""").findAll(text).map { it.groupValues[1] }.toSet()
        val extra = requested - allowed.get().toSet()
        if (extra.isNotEmpty()) throw GradleException("Kural Heart asks for permissions outside its list: $extra (see app/build.gradle.kts)")
        logger.lifecycle("Permissions checked: ${requested.sorted()}")
    }
}

val basePermissions = listOf(
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.USE_BIOMETRIC",
    "android.permission.USE_FINGERPRINT",
    "com.inigocode.kuralheart.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
)

androidComponents {
    onVariants { variant ->
        val name = variant.name.replaceFirstChar { it.uppercase() }
        val check = tasks.register<CheckPermissions>("check${name}Permissions") {
            mergedManifest.set(variant.artifacts.get(SingleArtifact.MERGED_MANIFEST))
            // Only copies installed from the website may install their own updates.
            allowed.set(if (variant.buildType == "release") basePermissions else basePermissions + "android.permission.REQUEST_INSTALL_PACKAGES")
        }
        tasks.matching { it.name == "assemble$name" || it.name == "bundle$name" }.configureEach { dependsOn(check) }
    }
}
