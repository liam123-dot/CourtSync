minikube delete
minikube start
helm install nginx-ingress ingress-nginx/ingress-nginx

kubectl apply -f Containers/k8s/aws-cognito-secrets.yaml
kubectl apply -f Containers/k8s/stripe-secrets.yaml
kubectl apply -f Containers/k8s/database-secrets-test.yaml
kubectl apply -f Containers/k8s/authentication-deployment.yaml
kubectl apply -f Containers/k8s/database-deployment.yaml
kubectl apply -f Containers/k8s/timetable-deployment.yaml
kubectl apply -f Containers/k8s/invoice-deployment.yaml
kubectl apply -f Containers/k8s/user-deployment.yaml
# kubectl apply -f Containers/k8s/api-service.yaml
