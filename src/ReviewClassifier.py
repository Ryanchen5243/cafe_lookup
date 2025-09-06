from sentence_transformers import SentenceTransformer
import joblib
class ReviewClassifier:
    def __init__(self,model="models/svm_classifier.pkl",embedder="all-MiniLM-L6-v2") -> None:
        self.classifier = joblib.load(model)
        self.embedder = SentenceTransformer(embedder)
    def predict(self,review_list) -> int:
        emb = self.embedder.encode(review_list)
        pred = self.classifier.predict_proba(emb.tolist())
        return pred