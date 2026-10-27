package expo.modules.lockfitnative

import android.content.Context
import org.json.JSONObject

object ExerciseSessionStore {
  private const val PREFS_NAME = "lockfit_exercise_session"
  private const val KEY_RESULT = "pending_result"

  fun save(context: Context, payload: Map<String, Any>) {
    val json = JSONObject()
    payload.forEach { (key, value) ->
      json.put(key, value)
    }

    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_RESULT, json.toString())
      .apply()
  }

  fun consume(context: Context): Map<String, Any>? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val jsonString = prefs.getString(KEY_RESULT, null) ?: return null
    prefs.edit().remove(KEY_RESULT).apply()

    val json = JSONObject(jsonString)
    return buildMap {
      val keys = json.keys()
      while (keys.hasNext()) {
        val key = keys.next()
        put(key, json.get(key))
      }
    }
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().clear().commit()
  }
}
