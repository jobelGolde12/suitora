# Suitora — Height & Weight Prediction Plan

This document details the technical approach and algorithmic plan for estimating a user's absolute height, weight, and related body traits from a single whole-body photograph.

---

## 1. Input Requirements & Image Quality Guidelines
To achieve high-accuracy estimation, the input photo must satisfy the following constraints:
- **Full-Body Coverage**: The user's entire body must be visible from head to toe. Truncated photos (e.g., knees-up) will trigger immediate validation errors or a low-confidence flag.
- **Front-Facing Standing Pose**: The user should stand straight with arms slightly away from the torso (A-pose or T-pose preferred) to allow clear boundary segmentation.
- **Camera Leveling**: The camera should ideally be positioned at waist height (parallel to the ground). Tilting the camera up or down introduces perspective distortion, which must be corrected by keypoint tilt estimation.
- **Lighting & Contrast**: Adequate contrast between the clothing and the background is necessary for silhouette segmentation.

---

## 2. Keypoint & Landmark Detection
We extract structural coordinates using body landmark models (e.g., PoseNet, BlazePose, or custom vision adapters):
- **Anthropometric Landmarks**:
  - `vertex` (top of head) and `heel` (bottom of feet)
  - Joint centers: shoulders, elbows, wrists, hips, knees, ankles
  - Torso boundaries: left/right waist, left/right hip outer margins
- **Pose Angle Detection**:
  - We calculate lean angles (e.g., shoulder-to-hip alignment) to check if the user is standing straight or leaning/rotated.
  - If rotation is detected, we apply a cosine correction factor to the segment widths.

---

## 3. Algorithm Option A: Vision LLM + Calibration Heuristics (Recommended)
This approach leverages advanced vision models (e.g., Gemini 1.5 Pro) combined with geometric heuristics.

### Step 1: Proportional Mapping
The vision model performs semantic segmentation and segment-ratio analysis:
$$\text{Ratio}_{\text{leg}} = \frac{y_{\text{hip}} - y_{\text{heel}}}{y_{\text{vertex}} - y_{\text{heel}}}$$
$$\text{Ratio}_{\text{torso}} = \frac{y_{\text{shoulder}} - y_{\text{hip}}}{y_{\text{vertex}} - y_{\text{heel}}}$$

### Step 2: Calibration to Absolute Height
To convert relative pixel proportions to absolute centimeters, we use calibration anchors:
1. **Garment/Footwear Anchor (Default Heuristic)**: Standard heights are estimated based on recognized shoe soles (typically adding $2.5\text{ cm}$ to $4.0\text{ cm}$) or common floor-to-ankle baseline ratios.
2. **User-Provided Anchor**: If the user inputs a single reference measurement (e.g., height), it serves as a strict baseline to calibrate the pixel-to-metric ratio:
   $$\text{Scale (px/cm)} = \frac{y_{\text{vertex}} - y_{\text{heel}}}{\text{Height}_{\text{user}}}$$

### Step 3: Silhouette Area & Weight Estimation
1. **Segmentation Silhouette**: We compute the total silhouette area in pixels ($A_{\text{pixel}}$) and normalize it by the height scale:
   $$A_{\text{metric}} = \frac{A_{\text{pixel}}}{\text{Scale}^2}$$
2. **Body Volume Proxy ($V_{\text{proxy}}$)**:
   $$V_{\text{proxy}} = A_{\text{metric}} \times w_{\text{average\_depth}}$$
   where $w_{\text{average\_depth}}$ is estimated by mapping the waist-to-hip width ratios ($W_{\text{hip}}/H_{\text{height}}$).
3. **BMI Mapping**:
   The vision model categorizes the silhouette into a BMI range (e.g., Underweight, Normal, Overweight, Obese) using visual markers (clavicle visibility, waist indentation, limb thickness).
4. **Final Weight Calculation**:
   $$\text{Weight (kg)} = \text{BMI}_{\text{estimated}} \times \left(\frac{\text{Height (cm)}}{100}\right)^2$$

---

## 4. Algorithm Option B: Classical Geometric Silhouette Estimation
A fallback option that runs entirely locally with classical image processing:
1. **Background Removal**: Extract the binary body mask.
2. **Pixel Aspect Ratio Calibration**: Calculate the aspect ratio of the bounding box around the body mask.
3. **Height Proxy**: Height is calculated by mapping the head-to-heel pixel length against a standardized camera field-of-view (FOV) and tilt angle.
4. **Regression Curve**: Weight is calculated via a polynomial regression model trained on silhouette-area-to-weight datasets:
   $$\text{Weight} = \alpha \cdot A_{\text{metric}}^2 + \beta \cdot A_{\text{metric}} + \gamma$$

---

## 5. Confidence Score Calculation
The confidence level ($C \in [0, 1]$) is determined by penalizing deviations from ideal capture conditions:
- **Pose lean penalty**: $P_{\text{lean}} = \max(0, \cos(\theta_{\text{torso}}) - 0.95)$
- **Contrast penalty**: $P_{\text{contrast}}$ based on edge definition sharpness.
- **Clothing coverage penalty**: High-fit clothing yields higher confidence ($C \ge 0.90$), whereas loose, baggy, or long garments degrade shape visibility ($C \approx 0.60 - 0.70$).

---

## 6. How Weight & Height Feed into Compatibility Scoring
Estimated characteristics directly influence the four core dimensions of Suitora's scoring:
1. **Body Fit Score**:
   - Compares the clothing's dimensions (e.g., chest width, sleeve length, waist size) against the predicted shoulder-to-shoulder width and waist diameter.
   - Penalities are applied if the garment is too tight (exceeds predicted boundary) or overly baggy (unless streetwear/relaxed style is selected).
2. **Style Match Score**:
   - Adjusts recommendations based on proportions. For instance, high waist-to-hip ratios recommend silhouettes that accentuate the waist (e.g., A-line cuts).
3. **Color Harmony Score**:
   - Indirectly influenced by the skin tone and hair color segmentations, which are mapped to seasonal color palettes (spring, summer, autumn, winter).
4. **Uncertainty Propagation**:
   - If the confidence score $C < 0.75$, the system dampens extreme scores, bringing them closer to a neutral range ($70\% - 75\%$) and appends an "Estimated" label in the UI to notify the user of the reduced precision.
