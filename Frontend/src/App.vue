<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const clientId = ref(0);
const cornCount = ref(0);
const alert = ref(false);
const countdown = ref(0);
const intervalId = ref(null);

const startCountdown = () => {
  countdown.value = 60;
  intervalId.value = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(intervalId.value);
      alert.value = false;
    }
  }, 1000);
};

const buyCorn = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/buy-corn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clientId: clientId.value }),
  });
  console.log(response.status);

  if (response.status == 429) {
    alert.value = true;
    return;
  }

  startCountdown();

  await cornBought();
};

const cornBought = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/corns-bought`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clientId: clientId.value }),
  });

  if (!response.ok) {
    throw new Error("Error en el registro");
  }

  const data = await response.json();
  cornCount.value = data.corn;
};

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdParam = urlParams.get("clientId");
  if (clientIdParam) {
    clientId.value = parseInt(clientIdParam);
  } else {
    clientId.value = Math.floor(Math.random() * 999) + 1;
  }
  await cornBought();
});
</script>

<template>
  <div>
    <Card class="w-[350px] flex flex-col items-center justify-center">
      <CardHeader>
        <CardTitle>Client ID: {{ clientId }}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
          @click="buyCorn"
        >
          Buy Corn
        </Button>
      </CardContent>
      <CardFooter>
        <small>You have bought {{ cornCount }} corn 🌽</small>
      </CardFooter>
    </Card>
    <AlertDialog v-model:open="alert">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Information</AlertDialogTitle>
          <AlertDialogDescription>
            you can buy 1🌽 per minute, try again in
            <strong>{{ countdown }}</strong> seconds
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
