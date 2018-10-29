/**
 * App
 */
let app = angular.module("san-andreas-map", []);

/**
 * Map
 */
app.service("Map", function ($window) {
  /**
   * @private
   */
  let self = this;
  /**
   * @type {object}
   */
  self.element = angular.element("body");
  /**
   * @type {number}
   */
  self.maxSize = 6000;
  /**
   * @type {number}
   */
  self.size = self.maxSize;
  /**
   * Convert map point to web point
   *
   * @type {function}
   * @returns {object}
   *
   * @param {number} point
   */
  self.getCoordinate = function (point) {
    let factor = self.size / self.maxSize;
    let base = (self.maxSize / 2) * factor;
    return base + (point * factor);
  };
  /**
   * Convert map size to web size
   *
   * @type {function}
   * @returns {number}
   *
   * @param {number} size
   */
  self.getSize = function (size) {
    return size * (self.size / self.maxSize);
  };
  /**
   * @type {function}
   * @returns {null}
   *
   * @param {zoomIn} boolean
   */
  self.zoom = function (zoomIn) {
    let min = self.element.width();
    let amount = 500;
    if (zoomIn) {
      self.size -= amount;
    } else {
      self.size += amount;
    }
    if (self.size < min) {
      self.size = min;
    } else if (self.size > self.maxSize) {
      self.size = self.maxSize;
    }
  };
  /**
   * @type {function}
   * @returns {null}
   *
   * @param {direction} string
   */
  self.move = function (direction) {
    let amount = 500;
    let element = angular.element("html, body");
    let window = angular.element($window);
    if (direction == "up") {
      animate = { scrollTop: window.scrollTop() - amount };
    } else if (direction == "down") {
      animate = { scrollTop: window.scrollTop() + amount };
    } else if (direction == "left") {
      animate = { scrollLeft: window.scrollLeft() - amount };
    } else if (direction == "right") {
      animate = { scrollLeft: window.scrollLeft() + amount };
    }
    element.stop().animate(animate, 200, "linear");
  };
});

/**
 * Storm
 */
app.service("Storm", function (Map) {
  /**
   * @type {private}
   */
  var self = this;
  /**
   * @type {number}
   */
  self.diameter = 3000;
  /**
   * @type {object}
   */
  self.position = {
    x: 0,
    y: 0,
  };
  /**
   * @type {function}
   * @returns {string}
   */
  self.getStyle = function () {
    // Convert size
    let size = Map.getSize(self.diameter);
    // Converted position
    let position = {
      x: Map.getCoordinate(self.position.x) - (size / 2),
      y: Map.getCoordinate(self.position.y) - (size / 2),
    };
    // Final style
    return (
      "left:" + position.x + "px;" +
      "top:" + position.y + "px;" +
      "width:" + size + "px;" +
      "height:" + size + "px;"
    );
  };
});

/**
 * Marker
 */
app.service("Marker", function (Map) {
  return function (data) {
    /**
     * @private
     */
    let self = this;
    /**
     * @type {object}
     */
    self.position = {
      x: data.x,
      y: data.y
    };
    /**
     * @type {function}
     * @returns {string}
     */
    self.getStyle = function () {
      // Get converted position
      let position = {
        x: Map.getCoordinate(self.position.x),
        y: Map.getCoordinate(self.position.y),
      };
      // Final style
      return "left: " + position.x + "px; top: " + position.y + "px";
    };
  };
});

/**
 * Main controller
 */
app.controller("MainController", function (Map, Storm, Marker, $scope, $window, $timeout) {
  /**
   * @type {boolean}
   */
  $scope.loading = true;
  /**
   * @type {Map}
   */
  $scope.map = Map;
  /**
   * @type {Storm}
   */
  $scope.storm = Storm;
  /**
   * @type {Array<Marker>}
   */
  $scope.markers = [
    new Marker({
      x: -1500,
      y: 500,
    }),
    new Marker({
      x: 0,
      y: 0,
    }),
    new Marker({
      x: 1500,
      y: 0,
    }),
    new Marker({
      x: 100,
      y: 250,
    }),
    new Marker({
      x: 250,
      y: -250,
    }),
    new Marker({
      x: -1500,
      y: 0,
    }),
  ];
  /**
   * On page load
   */
  angular.element($window).on("load", function () {
    // Initial bootstrap popovers for markers
    $("[data-toggle=popover]").popover({
      placement: "top",
      trigger: "hover",
    });
    // On content rendered
    $timeout(function () {
      // Fully zoom out map
      Map.size = 0;
      Map.zoom(false);
      // After a while
      $timeout(function () {
        // Scroll to middle of the map
        let scrollTop = (angular.element("body").height() / 2) - ($window.innerHeight / 2);
        angular.element("html, body").animate({
          scrollTop: scrollTop
        }, 200);
        // Loading is done
        $scope.loading = false;
      }, 2000);
    });
  });
});
