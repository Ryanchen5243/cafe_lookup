from sentence_transformers import SentenceTransformer
import joblib
class ReviewClassifier:
    def __init__(self,model="models/svm_classifier.pkl") -> None:
        self.classifier = joblib.load(model)
        self.embedder = SentenceTransformer("models/all_minilm_l6_v2")
    def predict(self,review_list) -> int:
        emb = self.embedder.encode(
            review_list,
            batch_size=128,
            convert_to_numpy=True,
            show_progress_bar=True
        )
        pred = self.classifier.predict_proba(emb.tolist())
        return pred