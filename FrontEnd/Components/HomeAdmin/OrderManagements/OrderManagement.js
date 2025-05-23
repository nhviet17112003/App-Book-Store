import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  ImageBackground,
} from "react-native";
import axios from "../../../axiosConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("default");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.error("Token not found. Please log in again.");
          return;
        }

        const response = await axios.get("/api/orders/admin", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(response.data);
      } catch (error) {
        console.error(
          "Error fetching orders:",
          error.response ? error.response.data : error.message
        );
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSortChange = (value) => {
    setSortType(value);
  };

  const sortedOrders = () => {
    return [...orders].sort((a, b) => {
      if (a.order_status === "Waiting" && b.order_status !== "Waiting") {
        return -1;
      }
      if (a.order_status !== "Waiting" && b.order_status === "Waiting") {
        return 1;
      }

      switch (sortType) {
        case "price_desc":
          return b.total_price - a.total_price;
        case "price_asc":
          return a.total_price - b.total_price;
        case "date_desc":
          return new Date(b.order_date) - new Date(a.order_date);
        case "date_asc":
          return new Date(a.order_date) - new Date(b.order_date);
        case "name_asc":
          return a.user.fullname.localeCompare(b.user.fullname);
        case "name_desc":
          return b.user.fullname.localeCompare(a.user.fullname);
        default:
          return 0;
      }
    });
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.post(
        `/api/orders/status/${orderId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, order_status: status } : order
        )
      );
      Alert.alert("Success", `Order has been ${status}`);
    } catch (error) {
      console.error(
        "Error updating order status:",
        error.response ? error.response.data : error.message
      );
      Alert.alert("Error", "Unable to update order status.");
    } finally {
      setModalVisible(false);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <ImageBackground
      source={require("../../../assets/Images/onboarding/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text>
              <Icon name="arrow-left" size={20} color="#000" />
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Order Management</Text>
        </View>

        <Picker
          selectedValue={sortType}
          style={styles.picker}
          onValueChange={handleSortChange}
        >
          <Picker.Item label="Sort by" value="default" />
          <Picker.Item label="Price (High to Low)" value="price_desc" />
          <Picker.Item label="Price (Low to High)" value="price_asc" />
          <Picker.Item label="Date (Newest First)" value="date_desc" />
          <Picker.Item label="Date (Oldest First)" value="date_asc" />
          <Picker.Item label="Name (A-Z)" value="name_asc" />
          <Picker.Item label="Name (Z-A)" value="name_desc" />
        </Picker>

        <ScrollView contentContainerStyle={styles.scrollView}>
          {sortedOrders().map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.card}
              onPress={() => handleOrderClick(order)}
            >
              <Text style={styles.cardText}>ID: {order._id}</Text>
              <Text style={styles.cardText}>User: {order.user.fullname}</Text>
              <Text style={styles.cardText}>Status: {order.order_status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedOrder && (
                <View>
                  <Text style={styles.modalText}>ID: {selectedOrder._id}</Text>
                  <Text style={styles.modalText}>
                    User: {selectedOrder.user.fullname}
                  </Text>
                  <Text style={styles.modalText}>
                    Address: {selectedOrder.address}
                  </Text>
                  <Text style={styles.modalText}>
                    Phone: {selectedOrder.phone}
                  </Text>
                  <Text style={styles.modalText}>
                    Total Price: {selectedOrder.total_price}
                  </Text>
                  <Text style={styles.modalText}>
                    Status: {selectedOrder.order_status}
                  </Text>
                  <Text style={styles.modalText}>
                    Order Date:{" "}
                    {new Date(selectedOrder.order_date).toLocaleDateString()}
                  </Text>

                  <ScrollView style={{ maxHeight: 200 }}>
                    {selectedOrder.order_details.map((item, index) => (
                      <View key={index} style={styles.outlineItem}>
                        <View style={styles.item}>
                          <Image
                            source={{
                              uri:
                                item.book.imageurls?.find(
                                  (img) => img.defaultImg
                                )?.imageUrl ||
                                item.book.imageurls?.[0]?.imageUrl ||
                                null,
                            }}
                            style={styles.image}
                          />
                          <View style={styles.rightContent}>
                            <Text style={styles.title}>{item.book.title}</Text>
                            <Text style={styles.text}>
                              Quantity: {item.order_quantity}
                            </Text>
                            <Text style={styles.text}>
                              Price: ${item.order_price.toFixed(2)}
                            </Text>
                            <Text style={styles.text}>
                              Total: $
                              {(item.order_price * item.order_quantity).toFixed(
                                2
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.closeButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                    {selectedOrder.order_status !== "Success" && (
                      <>
                        <TouchableOpacity
                          style={[styles.button, styles.cancelButton]}
                          onPress={() =>
                            updateOrderStatus(selectedOrder._id, "Cancel")
                          }
                        >
                          <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.acceptButton]}
                          onPress={() =>
                            updateOrderStatus(selectedOrder._id, "Success")
                          }
                        >
                          <Text style={styles.buttonText}>Accept</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 248, 248, 0.2)",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  picker: {
    marginVertical: 20,
  },
  scrollView: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  outlineItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  rightContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  text: {
    fontSize: 14,
    color: "#555",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: "#999",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default OrderManagement;
