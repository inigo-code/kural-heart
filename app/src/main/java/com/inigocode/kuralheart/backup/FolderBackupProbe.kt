package com.inigocode.kuralheart.backup

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.edit
import androidx.documentfile.provider.DocumentFile
import java.time.Instant

/**
 * Milestone 0's question: can a no-internet app keep its backup in a folder the person picks,
 * including a cloud folder such as Google Drive, and still reach it after a restart?
 *
 * The Storage Access Framework hands us a tree URI; the provider (Drive, OneDrive, a USB stick) does any syncing.
 * Kural Heart itself never opens a network connection.
 */
class FolderBackupProbe(private val context: Context) {
    private val prefs = context.getSharedPreferences("backup_probe", Context.MODE_PRIVATE)

    val savedFolder: Uri? get() = prefs.getString(KEY, null)?.let(Uri::parse)

    /** Keep access to the picked folder across restarts. */
    fun remember(tree: Uri) {
        context.contentResolver.takePersistableUriPermission(
            tree, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION,
        )
        prefs.edit { putString(KEY, tree.toString()) }
    }

    fun stillPermitted(tree: Uri): Boolean =
        context.contentResolver.persistedUriPermissions.any { it.uri == tree && it.isWritePermission }

    /** Write a small file, read it back, and report what happened in plain words. */
    fun writeAndReadBack(tree: Uri): Result<String> = runCatching {
        val dir = DocumentFile.fromTreeUri(context, tree) ?: error("That folder can't be opened.")
        check(dir.canWrite()) { "Kural Heart can't write in that folder." }
        val stamp = Instant.now().toString()
        val body = "Kural Heart backup test\n$stamp\n"
        val file = dir.findFile(FILE_NAME) ?: dir.createFile("text/plain", FILE_NAME) ?: error("The folder refused a new file.")
        context.contentResolver.openOutputStream(file.uri, "wt")!!.use { it.write(body.toByteArray()) }
        val back = context.contentResolver.openInputStream(file.uri)!!.use { it.readBytes().decodeToString() }
        check(back == body) { "The file read back differently from what was written." }
        "Wrote and read back ${file.name} in ${dir.name ?: "the folder"} at $stamp."
    }

    private companion object {
        const val KEY = "tree"
        const val FILE_NAME = "kural-heart-backup-test.txt"
    }
}
