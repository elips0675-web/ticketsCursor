# Deploy to Kubernetes
# 1. Build images (or use registry)
#    docker build -t servicedesk-api:latest ./server
#    docker build -t servicedesk-frontend:latest .
#
# 2. Create namespace and seed ConfigMap
#    kubectl create configmap mysql-seed -n servicedesk --from-file=server/seed.sql
#
# 3. Apply manifests
#    kubectl apply -f k8s/namespace.yaml
#    kubectl apply -f k8s/api-config.yaml
#    kubectl apply -f k8s/mysql.yaml
#    kubectl apply -f k8s/redis.yaml
#    kubectl apply -f k8s/api.yaml
#    kubectl apply -f k8s/frontend.yaml
#
# 4. Wait for rollout
#    kubectl wait --for=condition=available --timeout=300s deployment/api -n servicedesk
#    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n servicedesk
#
# 5. Verify
#    kubectl get pods -n servicedesk
#    kubectl get svc -n servicedesk
