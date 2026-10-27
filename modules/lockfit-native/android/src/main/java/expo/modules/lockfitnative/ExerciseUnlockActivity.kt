package expo.modules.lockfitnative

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.SystemClock
import android.view.WindowManager
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

private enum class BodySide(val label: String) {
  LEFT("левая"),
  RIGHT("правая")
}

private data class FrameAssessment(
  val ready: Boolean,
  val message: String,
  val visibleCount: Int,
  val bodyHeightRatio: Float,
  val centered: Boolean
)

private data class ChallengeAssessment(
  val passed: Boolean,
  val progressText: String,
  val debugText: String
)

private data class ExerciseAssessment(
  val side: BodySide,
  val angle: Double,
  val visibilityScore: Float,
  val formOk: Boolean,
  val formMessage: String,
  val debugText: String
)

class ExerciseUnlockActivity : AppCompatActivity() {
  private lateinit var previewView: PreviewView
  private lateinit var titleText: TextView
  private lateinit var statusText: TextView
  private lateinit var personStatusText: TextView
  private lateinit var challengeText: TextView
  private lateinit var instructionText: TextView
  private lateinit var repetitionText: TextView
  private lateinit var qualityText: TextView
  private lateinit var detailText: TextView
  private lateinit var debugText: TextView
  private lateinit var hintText: TextView

  private lateinit var cameraExecutor: ExecutorService

  private val detector by lazy {
    PoseDetection.getClient(
      PoseDetectorOptions.Builder()
        .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
        .build()
    )
  }

  private var exerciseType = "pushups"
  private var challengeType = "wave-hand"
  private var requiredRepetitions = 10
  private var bonusMinutes = 15
  private var bottomThreshold = 75.0
  private var topThreshold = 155.0

  private lateinit var repetitionEngine: PoseRepetitionEngine
  private var repetitions = 0
  private var phase = RepetitionPhase.SEEKING_TOP
  private var challengeCompleted = false
  private var sessionFinished = false
  private var isProcessingFrame = false
  private val angleFilter = TemporalAngleFilter()
  private val waveGestureDetector = WaveGestureDetector()
  private var frameReadySince: Long? = null
  private var touchShoulderHoldSince: Long? = null
  private val sideSelector = StableSideSelector<BodySide>()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    setContentView(R.layout.activity_exercise_unlock)

    previewView = findViewById(R.id.previewView)
    titleText = findViewById(R.id.titleText)
    statusText = findViewById(R.id.statusText)
    personStatusText = findViewById(R.id.personStatusText)
    challengeText = findViewById(R.id.challengeText)
    instructionText = findViewById(R.id.instructionText)
    repetitionText = findViewById(R.id.repetitionText)
    qualityText = findViewById(R.id.qualityText)
    detailText = findViewById(R.id.detailText)
    debugText = findViewById(R.id.debugText)
    hintText = findViewById(R.id.hintText)

    exerciseType = intent.getStringExtra(EXTRA_EXERCISE_TYPE)
      ?.takeIf { it == "pushups" || it == "squats" }
      ?: "pushups"
    challengeType = intent.getStringExtra(EXTRA_CHALLENGE_TYPE)
      ?.takeIf { it == "wave-hand" || it == "touch-shoulder" }
      ?: "wave-hand"
    requiredRepetitions = intent.getIntExtra(EXTRA_REQUIRED_REPETITIONS, 10)
    bonusMinutes = intent.getIntExtra(EXTRA_BONUS_MINUTES, 15)
    bottomThreshold = intent.getDoubleExtra(EXTRA_BOTTOM_THRESHOLD, 75.0)
    topThreshold = intent.getDoubleExtra(EXTRA_TOP_THRESHOLD, 155.0)
    requiredRepetitions = requiredRepetitions.coerceIn(1, 100)
    bonusMinutes = bonusMinutes.coerceIn(1, 120)
    if (bottomThreshold !in 35.0..130.0 || topThreshold !in 120.0..179.0 || bottomThreshold >= topThreshold) {
      bottomThreshold = if (exerciseType == "squats") 95.0 else 75.0
      topThreshold = if (exerciseType == "squats") 165.0 else 155.0
    }
    repetitionEngine = PoseRepetitionEngine(
      RepetitionEngineConfig(
        bottomThreshold = bottomThreshold,
        topThreshold = topThreshold
      )
    )

    cameraExecutor = Executors.newSingleThreadExecutor()
    renderStaticUi()

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          finishSession(
            status = "cancelled",
            message = "Сессия упражнения была отменена"
          )
        }
      }
    )

    ensureCameraPermissionAndStart()
  }

  override fun onDestroy() {
    detector.close()
    cameraExecutor.shutdown()
    super.onDestroy()
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)

    if (requestCode != REQUEST_CAMERA_PERMISSION) {
      return
    }

    val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
    if (granted) {
      startCamera()
    } else {
      finishSession(
        status = "failed",
        message = "Без доступа к камере LockFit не может проверить упражнение"
      )
    }
  }

  private fun renderStaticUi() {
    val exerciseLabel = if (exerciseType == "squats") "Приседания" else "Отжимания"

    titleText.text = "LockFit: $exerciseLabel"
    challengeText.text = challengeTitle(challengeType)
    instructionText.text = challengeInstruction(challengeType)
    repetitionText.text = "0 / $requiredRepetitions"
    qualityText.text = "Качество позы: ожидаем тело в кадре"
    detailText.text = exerciseDetail(exerciseType)
    debugText.text = "Угол: -- | Сторона: -- | Фаза: ожидание"
    hintText.text = "Назад = отмена. Держи все тело в кадре."
    statusText.text = "Подготовка камеры..."
    personStatusText.text = "Ищем человека в кадре"
  }

  private fun ensureCameraPermissionAndStart() {
    val permissionState = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
    if (permissionState == PackageManager.PERMISSION_GRANTED) {
      startCamera()
      return
    }

    ActivityCompat.requestPermissions(
      this,
      arrayOf(Manifest.permission.CAMERA),
      REQUEST_CAMERA_PERMISSION
    )
  }

  @androidx.camera.core.ExperimentalGetImage
  private fun startCamera() {
    statusText.text = "Камера запущена. Встань боком и держи все тело в кадре."

    val providerFuture = ProcessCameraProvider.getInstance(this)
    providerFuture.addListener(
      {
        try {
          val cameraProvider = providerFuture.get()
          val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
          }

          val analyzer = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also { analysis ->
              analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                val mediaImage = imageProxy.image
                if (mediaImage == null || isProcessingFrame) {
                  imageProxy.close()
                  return@setAnalyzer
                }

                isProcessingFrame = true

                val rotationDegrees = imageProxy.imageInfo.rotationDegrees
                val image = InputImage.fromMediaImage(
                  mediaImage,
                  rotationDegrees
                )

                detector
                  .process(image)
                  .addOnSuccessListener { pose ->
                    val frameWidth = if (rotationDegrees % 180 == 0) image.width else image.height
                    val frameHeight = if (rotationDegrees % 180 == 0) image.height else image.width
                    handlePose(pose, frameWidth.toFloat(), frameHeight.toFloat())
                  }
                  .addOnFailureListener {
                    renderLiveUi(
                      status = "Не удалось обработать кадр. Попробуй еще раз.",
                      personStatus = "Поза не распознана",
                      quality = "Качество позы: нет данных",
                      detail = exerciseDetail(exerciseType),
                      debug = "Ошибка анализа текущего кадра"
                    )
                  }
                  .addOnCompleteListener {
                    isProcessingFrame = false
                    imageProxy.close()
                  }
              }
            }

          val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
            .build()

          cameraProvider.unbindAll()
          cameraProvider.bindToLifecycle(this, cameraSelector, preview, analyzer)
        } catch (_: Exception) {
          finishSession(
            status = "failed",
            message = "Не удалось запустить фронтальную камеру на этом устройстве"
          )
        }
      },
      ContextCompat.getMainExecutor(this)
    )
  }

  private fun handlePose(pose: Pose, frameWidth: Float, frameHeight: Float) {
    if (sessionFinished) {
      return
    }

    val now = SystemClock.elapsedRealtime()
    val frame = assessFrameCoverage(pose, frameWidth, frameHeight)
    if (!frame.ready) {
      frameReadySince = null
      resetChallengeTracking()
      handleTrackingLoss(now)
      renderLiveUi(
        status = frame.message,
        personStatus = "Человек еще не готов к анализу",
        quality = "Качество позы: низкое",
        detail = exerciseDetail(exerciseType),
        debug = buildFrameDebug(frame, null)
      )
      return
    }

    if (!challengeCompleted) {
      val readySince = frameReadySince ?: now.also { frameReadySince = it }
      if (now - readySince < BODY_STABILITY_HOLD_MS) {
        renderLiveUi(
          status = "Не двигай телефон. Проверяем устойчивость кадра...",
          personStatus = "Человек найден",
          quality = "Качество позы: стабилизируем",
          detail = "Побудь полностью в кадре еще мгновение.",
          debug = buildFrameDebug(frame, "Стабилизация тела")
        )
        return
      }

      val challenge = detectChallenge(pose, frameWidth, frameHeight)
      renderLiveUi(
        status = if (challenge.passed) {
          "Челлендж принят. Теперь займи стартовую позицию."
        } else {
          "Сначала выполни мини-челлендж"
        },
        personStatus = "Человек в кадре",
        quality = "Качество позы: достаточно для старта",
        detail = challenge.progressText,
        debug = buildFrameDebug(frame, challenge.debugText)
      )

      if (challenge.passed) {
        challengeCompleted = true
        resetExerciseTracking()
        renderLiveUi(
          status = "Челлендж принят. Займи стартовую позицию.",
          personStatus = "Человек в кадре",
          quality = "Качество позы: достаточно для упражнения",
          detail = exerciseDetail(exerciseType),
          debug = buildFrameDebug(frame, "Челлендж: пройден")
        )
      }
      return
    }

    val exercise = assessExercisePose(pose, frameWidth, frameHeight, now)
    if (exercise == null) {
      handleTrackingLoss(now)
      renderLiveUi(
        status = "Не вижу нужные суставы. Повернись боком и отойди чуть дальше.",
        personStatus = "Человек в кадре",
        quality = "Качество позы: недостаточно для подсчета",
        detail = exerciseDetail(exerciseType),
        debug = buildFrameDebug(frame, "Нет надежной стороны для анализа")
      )
      return
    }

    val filteredAngle = angleFilter.process(exercise.angle, now)
    if (!exercise.formOk) {
      handleTrackingLoss(now)
      renderLiveUi(
        status = exercise.formMessage,
        personStatus = "Человек в кадре",
        quality = "Качество позы: нужно поправить стойку",
        detail = exerciseDetail(exerciseType),
        debug = buildFrameDebug(frame, "${exercise.debugText} | Угол ${filteredAngle.roundToInt()}°")
      )
      return
    }

    val engineResult = repetitionEngine.process(filteredAngle, now)
    repetitions = engineResult.repetitions
    phase = engineResult.phase
    val statusMessage = repetitionStatus(engineResult)
    renderLiveUi(
      status = statusMessage,
      personStatus = "Человек в кадре",
      quality = "Качество позы: хорошее",
      detail = exerciseDetail(exerciseType),
      debug = buildFrameDebug(
        frame,
        "${exercise.debugText} | Угол ${filteredAngle.roundToInt()}° | Фаза ${phase.name}"
      )
    )

    if (repetitions >= requiredRepetitions) {
      finishSession(
        status = "completed",
        message = "Упражнение выполнено, бонус времени начислен"
      )
    }
  }

  private fun repetitionStatus(result: RepetitionEngineResult): String {
    return when (result.event) {
      RepetitionEvent.START_LOCKED -> "Стартовая позиция принята. Выполняй полное движение."
      RepetitionEvent.BOTTOM_LOCKED -> "Нижняя точка поймана. Возвращайся вверх."
      RepetitionEvent.REPETITION_COUNTED -> "Повтор засчитан"
      RepetitionEvent.MOVEMENT_TOO_FAST -> "Слишком быстро. Сделай следующее повторение плавнее."
      RepetitionEvent.MOVEMENT_TOO_SLOW -> "Движение потеряно. Вернись в верхнюю точку и начни повтор заново."
      else -> when (result.phase) {
        RepetitionPhase.SEEKING_TOP -> if (exerciseType == "squats") {
          "Встань в верхнюю точку перед первым приседом."
        } else {
          "Выпрями руки в верхней точке перед первым повтором."
        }
        RepetitionPhase.TOP -> if (exerciseType == "squats") {
          "Опускайся до рабочей глубины."
        } else {
          "Плавно опускайся до нижней точки."
        }
        RepetitionPhase.BOTTOM -> "Вернись в полную верхнюю позицию."
      }
    }
  }

  private fun detectChallenge(
    pose: Pose,
    frameWidth: Float,
    frameHeight: Float
  ): ChallengeAssessment {
    return when (challengeType) {
      "touch-shoulder" -> detectTouchShoulder(pose, frameWidth, frameHeight)
      else -> detectWaveHand(pose)
    }
  }

  private fun detectTouchShoulder(
    pose: Pose,
    frameWidth: Float,
    frameHeight: Float
  ): ChallengeAssessment {
    val leftWrist = point(pose, PoseLandmark.LEFT_WRIST)
    val rightWrist = point(pose, PoseLandmark.RIGHT_WRIST)
    val leftShoulder = point(pose, PoseLandmark.LEFT_SHOULDER)
    val rightShoulder = point(pose, PoseLandmark.RIGHT_SHOULDER)

    val leftTouching = leftWrist != null && rightShoulder != null &&
      distanceNormalized(leftWrist, rightShoulder, frameWidth, frameHeight) < 0.12
    val rightTouching = rightWrist != null && leftShoulder != null &&
      distanceNormalized(rightWrist, leftShoulder, frameWidth, frameHeight) < 0.12

    val now = SystemClock.elapsedRealtime()
    if (leftTouching || rightTouching) {
      touchShoulderHoldSince = touchShoulderHoldSince ?: now
    } else {
      touchShoulderHoldSince = null
    }

    val holdMs = touchShoulderHoldSince?.let { now - it } ?: 0L
    val progress = min(100, ((holdMs * 100L) / TOUCH_SHOULDER_HOLD_MS).toInt())
    return ChallengeAssessment(
      passed = holdMs >= TOUCH_SHOULDER_HOLD_MS,
      progressText = "Удерживай касание плеча: $progress%",
      debugText = "Челлендж touch-shoulder: left=$leftTouching right=$rightTouching hold=${holdMs}ms"
    )
  }

  private fun detectWaveHand(pose: Pose): ChallengeAssessment {
    val leftWrist = point(pose, PoseLandmark.LEFT_WRIST)
    val rightWrist = point(pose, PoseLandmark.RIGHT_WRIST)
    val leftElbow = point(pose, PoseLandmark.LEFT_ELBOW)
    val rightElbow = point(pose, PoseLandmark.RIGHT_ELBOW)
    val leftShoulder = point(pose, PoseLandmark.LEFT_SHOULDER)
    val rightShoulder = point(pose, PoseLandmark.RIGHT_SHOULDER)
    val leftHip = point(pose, PoseLandmark.LEFT_HIP)
    val rightHip = point(pose, PoseLandmark.RIGHT_HIP)

    val raisedHand = when {
      leftWrist != null && leftElbow != null && leftShoulder != null && leftHip != null &&
        leftWrist.second < leftElbow.second -> Triple(WaveSide.LEFT, leftWrist, Pair(leftShoulder, leftHip))
      rightWrist != null && rightElbow != null && rightShoulder != null && rightHip != null &&
        rightWrist.second < rightElbow.second -> Triple(WaveSide.RIGHT, rightWrist, Pair(rightShoulder, rightHip))
      else -> null
    }

    if (raisedHand == null) {
      waveGestureDetector.reset()
      return ChallengeAssessment(
        passed = false,
        progressText = "Подними руку выше локтя и помаши в сторону.",
        debugText = "Челлендж wave-hand: кисть еще не поднята"
      )
    }

    val side = raisedHand.first
    val wrist = raisedHand.second
    val shoulder = raisedHand.third.first
    val hip = raisedHand.third.second
    val torsoLength = hypot(
      (shoulder.first - hip.first).toDouble(),
      (shoulder.second - hip.second).toDouble()
    )
    if (torsoLength < MIN_CHALLENGE_TORSO_PIXELS) {
      waveGestureDetector.reset()
      return ChallengeAssessment(
        passed = false,
        progressText = "Подойди чуть ближе, чтобы жест был виден надежно.",
        debugText = "Челлендж wave-hand: torso=${"%.1f".format(Locale.US, torsoLength)}"
      )
    }

    val relativeOffset = (wrist.first - shoulder.first) / torsoLength
    val wave = waveGestureDetector.process(side, relativeOffset, SystemClock.elapsedRealtime())

    return ChallengeAssessment(
      passed = wave.passed,
      progressText = if (wave.reversals > 0) {
        "Жест распознан: ${wave.progressPercent}%"
      } else {
        "Помаши этой же рукой туда и обратно: ${wave.progressPercent}%"
      },
      debugText = "Челлендж wave-hand: side=$side sweep=${"%.2f".format(Locale.US, wave.sweep)} " +
        "reversals=${wave.reversals} duration=${wave.durationMs}ms"
    )
  }

  private fun assessFrameCoverage(
    pose: Pose,
    frameWidth: Float,
    frameHeight: Float
  ): FrameAssessment {
    val visiblePoints = TRACKED_LANDMARKS.mapNotNull {
      point(pose, it, COVERAGE_LANDMARK_LIKELIHOOD)
    }
    if (visiblePoints.size < 8) {
      return FrameAssessment(
        ready = false,
        message = "Нужно больше тела в кадре: видны не все ключевые точки.",
        visibleCount = visiblePoints.size,
        bodyHeightRatio = 0f,
        centered = false
      )
    }

    val minX = visiblePoints.minOf { it.first }
    val maxX = visiblePoints.maxOf { it.first }
    val minY = visiblePoints.minOf { it.second }
    val maxY = visiblePoints.maxOf { it.second }
    val bodyHeightRatio = (maxY - minY) / max(frameHeight, 1f)
    val centerXRatio = ((minX + maxX) / 2f) / max(frameWidth, 1f)
    val centered = centerXRatio in 0.20f..0.80f

    val headVisible = point(pose, PoseLandmark.NOSE, COVERAGE_LANDMARK_LIKELIHOOD) != null
    val shoulderVisible = listOf(PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER).any {
      point(pose, it, COVERAGE_LANDMARK_LIKELIHOOD) != null
    }
    val hipVisible = listOf(PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP).any {
      point(pose, it, COVERAGE_LANDMARK_LIKELIHOOD) != null
    }
    val ankleVisible = listOf(PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE).any {
      point(pose, it, COVERAGE_LANDMARK_LIKELIHOOD) != null
    }
    val coreVisible = headVisible && shoulderVisible && hipVisible && ankleVisible
    if (!coreVisible) {
      return FrameAssessment(
        ready = false,
        message = "Покажи в кадре голову, плечи, таз и хотя бы одну стопу.",
        visibleCount = visiblePoints.size,
        bodyHeightRatio = bodyHeightRatio,
        centered = centered
      )
    }

    if (bodyHeightRatio < 0.45f) {
      return FrameAssessment(
        ready = false,
        message = "Подойди немного ближе: тело слишком маленькое в кадре.",
        visibleCount = visiblePoints.size,
        bodyHeightRatio = bodyHeightRatio,
        centered = centered
      )
    }

    if (bodyHeightRatio > 0.96f) {
      return FrameAssessment(
        ready = false,
        message = "Камера слишком близко. Отойди немного назад.",
        visibleCount = visiblePoints.size,
        bodyHeightRatio = bodyHeightRatio,
        centered = centered
      )
    }

    if (!centered) {
      return FrameAssessment(
        ready = false,
        message = "Сместись ближе к центру кадра.",
        visibleCount = visiblePoints.size,
        bodyHeightRatio = bodyHeightRatio,
        centered = false
      )
    }

    return FrameAssessment(
      ready = true,
      message = "Тело распознано стабильно.",
      visibleCount = visiblePoints.size,
      bodyHeightRatio = bodyHeightRatio,
      centered = true
    )
  }

  private fun assessExercisePose(
    pose: Pose,
    frameWidth: Float,
    frameHeight: Float,
    timestampMs: Long
  ): ExerciseAssessment? {
    val left = buildExerciseAssessment(pose, BodySide.LEFT, frameWidth, frameHeight)
    val right = buildExerciseAssessment(pose, BodySide.RIGHT, frameWidth, frameHeight)

    val assessments = listOfNotNull(left, right)
    if (assessments.isEmpty()) {
      return null
    }

    val selection = sideSelector.select(
      assessments.associate { it.side to it.visibilityScore.toDouble() },
      timestampMs
    )
    if (selection.changed) {
      angleFilter.reset()
    }
    return assessments.firstOrNull { it.side == selection.side }
  }

  private fun buildExerciseAssessment(
    pose: Pose,
    side: BodySide,
    frameWidth: Float,
    frameHeight: Float
  ): ExerciseAssessment? {
    val shoulderType = if (side == BodySide.LEFT) PoseLandmark.LEFT_SHOULDER else PoseLandmark.RIGHT_SHOULDER
    val elbowType = if (side == BodySide.LEFT) PoseLandmark.LEFT_ELBOW else PoseLandmark.RIGHT_ELBOW
    val wristType = if (side == BodySide.LEFT) PoseLandmark.LEFT_WRIST else PoseLandmark.RIGHT_WRIST
    val hipType = if (side == BodySide.LEFT) PoseLandmark.LEFT_HIP else PoseLandmark.RIGHT_HIP
    val kneeType = if (side == BodySide.LEFT) PoseLandmark.LEFT_KNEE else PoseLandmark.RIGHT_KNEE
    val ankleType = if (side == BodySide.LEFT) PoseLandmark.LEFT_ANKLE else PoseLandmark.RIGHT_ANKLE

    val shoulder = point(pose, shoulderType) ?: return null
    val hip = point(pose, hipType) ?: return null

    return if (exerciseType == "squats") {
      val knee = point(pose, kneeType) ?: return null
      val ankle = point(pose, ankleType) ?: return null
      val oppositeShoulderType = if (side == BodySide.LEFT) {
        PoseLandmark.RIGHT_SHOULDER
      } else {
        PoseLandmark.LEFT_SHOULDER
      }
      val oppositeShoulder = point(pose, oppositeShoulderType) ?: return null
      val angle = calculateAngle(hip, knee, ankle) ?: return null
      val legSpan = distanceNormalized(hip, ankle, frameWidth, frameHeight)
      val torsoLength = distanceNormalized(shoulder, hip, frameWidth, frameHeight)
      val shoulderWidth = distanceNormalized(
        shoulder,
        oppositeShoulder,
        frameWidth,
        frameHeight
      )
      val sideOn = shoulderWidth <= torsoLength * 0.72
      val upright = shoulder.second < hip.second && hip.second < ankle.second

      val formMessage = when {
        legSpan < 0.16 -> "Отойди чуть дальше, чтобы бедро и голень были видны целиком."
        !sideOn -> "Повернись к камере боком для точного подсчета приседаний."
        !upright -> "Встань ровнее: плечо должно быть выше таза, а таз выше щиколотки."
        else -> "Форма хорошая"
      }

      ExerciseAssessment(
        side = side,
        angle = angle,
        visibilityScore = exerciseVisibilityScore(pose, side),
        formOk = legSpan >= 0.16 && sideOn && upright,
        formMessage = formMessage,
        debugText = "Сторона ${side.label} | leg=${legSpan.format2()} | shoulders=${shoulderWidth.format2()} | torso=${torsoLength.format2()} | sideOn=$sideOn"
      )
    } else {
      val elbow = point(pose, elbowType) ?: return null
      val wrist = point(pose, wristType) ?: return null
      val ankle = point(pose, ankleType) ?: return null
      val angle = calculateAngle(shoulder, elbow, wrist) ?: return null
      val armSpan = distanceNormalized(shoulder, wrist, frameWidth, frameHeight)
      val bodyHorizontalSpan = abs(shoulder.first - ankle.first)
      val bodyVerticalSpan = abs(shoulder.second - ankle.second)
      val sideOn = bodyHorizontalSpan > bodyVerticalSpan * 1.15f
      val plankAngle = calculateAngle(shoulder, hip, ankle) ?: return null
      val bodyStraight = plankAngle >= 145.0
      val wristBelowShoulder = wrist.second > shoulder.second + frameHeight * 0.04f

      val formMessage = when {
        armSpan < 0.14 -> "Отойди чуть дальше, чтобы рука была видна целиком."
        !sideOn -> "Разверни телефон боком к линии тела: плечо и стопы должны быть в кадре."
        !bodyStraight -> "Выпрями корпус: не опускай и не поднимай таз относительно спины."
        !wristBelowShoulder -> "Опусти руки так, чтобы кисть и локоть хорошо читались."
        else -> "Форма хорошая"
      }

      ExerciseAssessment(
        side = side,
        angle = angle,
        visibilityScore = exerciseVisibilityScore(pose, side),
        formOk = armSpan >= 0.14 && sideOn && bodyStraight && wristBelowShoulder,
        formMessage = formMessage,
        debugText = "Сторона ${side.label} | arm=${armSpan.format2()} | plank=${plankAngle.roundToInt()}° | horizontal=$sideOn"
      )
    }
  }

  private fun exerciseVisibilityScore(pose: Pose, side: BodySide): Float {
    return if (exerciseType == "squats") {
      visibilityScore(
        pose,
        if (side == BodySide.LEFT) listOf(
          PoseLandmark.LEFT_HIP,
          PoseLandmark.LEFT_KNEE,
          PoseLandmark.LEFT_ANKLE
        ) else listOf(
          PoseLandmark.RIGHT_HIP,
          PoseLandmark.RIGHT_KNEE,
          PoseLandmark.RIGHT_ANKLE
        )
      )
    } else {
      visibilityScore(
        pose,
        if (side == BodySide.LEFT) listOf(
          PoseLandmark.LEFT_SHOULDER,
          PoseLandmark.LEFT_ELBOW,
          PoseLandmark.LEFT_WRIST
        ) else listOf(
          PoseLandmark.RIGHT_SHOULDER,
          PoseLandmark.RIGHT_ELBOW,
          PoseLandmark.RIGHT_WRIST
        )
      )
    }
  }

  private fun visibilityScore(pose: Pose, types: List<Int>): Float {
    return types.sumOf { type ->
      pose.getPoseLandmark(type)?.inFrameLikelihood?.toDouble() ?: 0.0
    }.toFloat() / types.size.coerceAtLeast(1)
  }

  private fun resetChallengeTracking() {
    touchShoulderHoldSince = null
    waveGestureDetector.reset()
  }

  private fun resetExerciseTracking() {
    angleFilter.reset()
    sideSelector.reset()
    repetitionEngine.resetSession()
    repetitions = 0
    phase = RepetitionPhase.SEEKING_TOP
    resetChallengeTracking()
  }

  private fun handleTrackingLoss(timestampMs: Long) {
    if (!challengeCompleted) {
      return
    }

    val result = repetitionEngine.trackingLost(timestampMs)
    repetitions = result.repetitions
    phase = result.phase
    if (result.event == RepetitionEvent.TRACKING_RESET) {
      angleFilter.reset()
      sideSelector.reset()
    }
  }

  private fun renderLiveUi(
    status: String,
    personStatus: String,
    quality: String,
    detail: String,
    debug: String
  ) {
    runOnUiThread {
      statusText.text = status
      personStatusText.text = personStatus
      qualityText.text = quality
      detailText.text = detail
      debugText.text = debug
      repetitionText.text = "$repetitions / $requiredRepetitions"
    }
  }

  private fun buildFrameDebug(frame: FrameAssessment, tail: String?): String {
    val heightRatio = Math.round(frame.bodyHeightRatio * 100)
    val base = "Точек ${frame.visibleCount} | Рост $heightRatio% | Центр ${if (frame.centered) "ok" else "off"}"
    return if (tail.isNullOrBlank()) base else "$base\n$tail"
  }

  private fun point(
    pose: Pose,
    landmarkType: Int,
    minimumLikelihood: Float = MIN_LANDMARK_LIKELIHOOD
  ): Pair<Float, Float>? {
    val landmark = pose.getPoseLandmark(landmarkType) ?: return null
    if (landmark.inFrameLikelihood < minimumLikelihood) {
      return null
    }

    return landmark.position.x to landmark.position.y
  }

  private fun calculateAngle(
    first: Pair<Float, Float>,
    middle: Pair<Float, Float>,
    last: Pair<Float, Float>
  ): Double? = PoseGeometry.jointAngle(
    PosePoint(first.first.toDouble(), first.second.toDouble()),
    PosePoint(middle.first.toDouble(), middle.second.toDouble()),
    PosePoint(last.first.toDouble(), last.second.toDouble())
  )

  private fun distanceNormalized(
    first: Pair<Float, Float>,
    second: Pair<Float, Float>,
    frameWidth: Float,
    frameHeight: Float
  ): Double {
    val diagonal = hypot(frameWidth.toDouble(), frameHeight.toDouble()).coerceAtLeast(1.0)
    return hypot(
      (first.first - second.first).toDouble(),
      (first.second - second.second).toDouble()
    ) / diagonal
  }

  private fun finishSession(status: String, message: String) {
    if (sessionFinished) {
      return
    }

    sessionFinished = true

    if (status == "completed") {
      BlockingConfigStore.grantCurrentTarget(applicationContext, bonusMinutes)
    } else {
      BlockingConfigStore.clearCurrentTarget(applicationContext)
    }

    ExerciseSessionStore.save(
      applicationContext,
      mapOf(
        "status" to status,
        "message" to message,
        "exerciseType" to exerciseType,
        "challengeType" to challengeType,
        "repetitions" to repetitions,
        "requiredRepetitions" to requiredRepetitions,
        "bonusMinutes" to if (status == "completed") bonusMinutes else 0,
        "completedAt" to isoTimestampNow()
      )
    )

    setResult(RESULT_OK)
    finish()
  }

  private fun challengeTitle(type: String): String {
    return when (type) {
      "touch-shoulder" -> "Коснись плеча"
      else -> "Помаши рукой"
    }
  }

  private fun challengeInstruction(type: String): String {
    return when (type) {
      "touch-shoulder" -> "Коснись противоположного плеча рукой."
      else -> "Подними руку и коротко помаши влево-вправо."
    }
  }

  private fun exerciseDetail(type: String): String {
    return if (type == "squats") {
      "Стань боком к камере. В кадре должны быть плечо, бедро, колено и щиколотка."
    } else {
      "Стань боком к камере. В кадре должны быть плечо, локоть, кисть и таз."
    }
  }

  private fun isoTimestampNow(): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("UTC")
    return formatter.format(Date())
  }

  private fun Double.roundToInt(): Int = Math.round(this).toInt()

  private fun Double.format2(): String = String.format(Locale.US, "%.2f", this)

  companion object {
    private const val REQUEST_CAMERA_PERMISSION = 4102
    private const val MIN_LANDMARK_LIKELIHOOD = 0.50f
    private const val COVERAGE_LANDMARK_LIKELIHOOD = 0.35f
    private const val BODY_STABILITY_HOLD_MS = 400L
    private const val TOUCH_SHOULDER_HOLD_MS = 550L
    private const val MIN_CHALLENGE_TORSO_PIXELS = 36.0
    private val TRACKED_LANDMARKS = listOf(
      PoseLandmark.NOSE,
      PoseLandmark.LEFT_SHOULDER,
      PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW,
      PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_WRIST,
      PoseLandmark.LEFT_HIP,
      PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE,
      PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_ANKLE
    )
    const val EXTRA_EXERCISE_TYPE = "exerciseType"
    const val EXTRA_CHALLENGE_TYPE = "challengeType"
    const val EXTRA_REQUIRED_REPETITIONS = "requiredRepetitions"
    const val EXTRA_BONUS_MINUTES = "bonusMinutes"
    const val EXTRA_BOTTOM_THRESHOLD = "bottomThreshold"
    const val EXTRA_TOP_THRESHOLD = "topThreshold"
  }
}
